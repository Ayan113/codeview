import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

// Mock Prisma
const mockPrisma = {
    user: {
        findUnique: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
    },
};

jest.mock('../../src/config/database', () => ({
    prisma: mockPrisma,
}));

jest.mock('../../src/config', () => ({
    config: {
        jwtSecret: 'test-secret',
        jwtExpiresIn: '7d',
    },
}));

import { AuthService } from '../../src/services/auth.service';
import { ConflictError, UnauthorizedError, BadRequestError } from '../../src/utils/errors';

describe('AuthService', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('register', () => {
        it('should create a new user successfully', async () => {
            const mockUser = {
                id: 'user-123',
                email: 'test@example.com',
                name: 'Test User',
                role: 'USER',
                avatar: null,
            };

            mockPrisma.user.findUnique.mockResolvedValue(null);
            mockPrisma.user.create.mockResolvedValue(mockUser);

            const result = await AuthService.register({
                email: 'test@example.com',
                password: 'password123',
                name: 'Test User',
            });

            expect(result.user).toEqual(mockUser);
            expect(result.token).toBeDefined();
            expect(mockPrisma.user.create).toHaveBeenCalledWith(
                expect.objectContaining({
                    data: expect.objectContaining({
                        email: 'test@example.com',
                        name: 'Test User',
                    }),
                })
            );
        });

        it('should throw ConflictError if email already exists', async () => {
            mockPrisma.user.findUnique.mockResolvedValue({ id: 'existing-user' });

            await expect(
                AuthService.register({
                    email: 'existing@example.com',
                    password: 'password123',
                    name: 'Test User',
                })
            ).rejects.toThrow(ConflictError);
        });

        it('should throw BadRequestError if password is too short', async () => {
            mockPrisma.user.findUnique.mockResolvedValue(null);

            await expect(
                AuthService.register({
                    email: 'test@example.com',
                    password: 'short',
                    name: 'Test User',
                })
            ).rejects.toThrow(BadRequestError);
        });
    });

    describe('login', () => {
        it('should login successfully with valid credentials', async () => {
            const hashedPassword = await bcrypt.hash('password123', 12);
            const mockUser = {
                id: 'user-123',
                email: 'test@example.com',
                name: 'Test User',
                role: 'USER',
                avatar: null,
                password: hashedPassword,
                isActive: true,
            };

            mockPrisma.user.findUnique.mockResolvedValue(mockUser);
            mockPrisma.user.update.mockResolvedValue(mockUser);

            const result = await AuthService.login({
                email: 'test@example.com',
                password: 'password123',
            });

            expect(result.user.email).toBe('test@example.com');
            expect(result.token).toBeDefined();
            expect(result.user.password).toBeUndefined();
        });

        it('should throw UnauthorizedError for invalid email', async () => {
            mockPrisma.user.findUnique.mockResolvedValue(null);

            await expect(
                AuthService.login({
                    email: 'nonexistent@example.com',
                    password: 'password123',
                })
            ).rejects.toThrow(UnauthorizedError);
        });

        it('should throw UnauthorizedError for invalid password', async () => {
            const hashedPassword = await bcrypt.hash('password123', 12);
            mockPrisma.user.findUnique.mockResolvedValue({
                id: 'user-123',
                email: 'test@example.com',
                password: hashedPassword,
                isActive: true,
            });

            await expect(
                AuthService.login({
                    email: 'test@example.com',
                    password: 'wrongpassword',
                })
            ).rejects.toThrow(UnauthorizedError);
        });

        it('should throw UnauthorizedError for inactive user', async () => {
            const hashedPassword = await bcrypt.hash('password123', 12);
            mockPrisma.user.findUnique.mockResolvedValue({
                id: 'user-123',
                email: 'test@example.com',
                password: hashedPassword,
                isActive: false,
            });

            await expect(
                AuthService.login({
                    email: 'test@example.com',
                    password: 'password123',
                })
            ).rejects.toThrow(UnauthorizedError);
        });
    });

    describe('getProfile', () => {
        it('should return user profile', async () => {
            const mockProfile = {
                id: 'user-123',
                email: 'test@example.com',
                name: 'Test User',
                role: 'USER',
                avatar: null,
                createdAt: new Date(),
                lastLoginAt: new Date(),
                _count: {
                    createdInterviews: 5,
                    questionsCreated: 10,
                    submissions: 20,
                },
            };

            mockPrisma.user.findUnique.mockResolvedValue(mockProfile);

            const result = await AuthService.getProfile('user-123');

            expect(result).toEqual(mockProfile);
            expect(mockPrisma.user.findUnique).toHaveBeenCalledWith(
                expect.objectContaining({
                    where: { id: 'user-123' },
                })
            );
        });
    });
});
