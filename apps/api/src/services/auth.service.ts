import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { prisma } from '../config/database';
import { config } from '../config';
import { BadRequestError, ConflictError, UnauthorizedError } from '../utils/errors';
import { JwtPayload } from '../middleware/auth.middleware';

interface RegisterInput {
    email: string;
    password: string;
    name: string;
}

interface LoginInput {
    email: string;
    password: string;
}

interface AuthResponse {
    user: {
        id: string;
        email: string;
        name: string;
        role: string;
        avatar: string | null;
    };
    token: string;
    expiresIn: string;
}

export class AuthService {
    private static readonly SALT_ROUNDS = 12;

    static async register(input: RegisterInput): Promise<AuthResponse> {
        const { email, password, name } = input;

        // Check if user already exists
        const existingUser = await prisma.user.findUnique({
            where: { email: email.toLowerCase() },
        });

        if (existingUser) {
            throw new ConflictError('An account with this email already exists');
        }

        // Validate password strength
        if (password.length < 8) {
            throw new BadRequestError('Password must be at least 8 characters');
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, this.SALT_ROUNDS);

        // Create user
        const user = await prisma.user.create({
            data: {
                email: email.toLowerCase(),
                password: hashedPassword,
                name,
            },
            select: {
                id: true,
                email: true,
                name: true,
                role: true,
                avatar: true,
            },
        });

        // Generate token
        const token = this.generateToken(user.id, user.email, user.role);

        return {
            user,
            token,
            expiresIn: config.jwtExpiresIn,
        };
    }

    static async login(input: LoginInput): Promise<AuthResponse> {
        const { email, password } = input;

        // Find user
        const user = await prisma.user.findUnique({
            where: { email: email.toLowerCase() },
            select: {
                id: true,
                email: true,
                name: true,
                role: true,
                avatar: true,
                password: true,
                isActive: true,
            },
        });

        if (!user) {
            throw new UnauthorizedError('Invalid email or password');
        }

        if (!user.isActive) {
            throw new UnauthorizedError('Account is deactivated');
        }

        // Verify password
        const isPasswordValid = await bcrypt.compare(password, user.password);

        if (!isPasswordValid) {
            throw new UnauthorizedError('Invalid email or password');
        }

        // Update last login
        await prisma.user.update({
            where: { id: user.id },
            data: { lastLoginAt: new Date() },
        });

        // Generate token
        const token = this.generateToken(user.id, user.email, user.role);

        // Remove password from response
        const { password: _, ...userWithoutPassword } = user;

        return {
            user: userWithoutPassword,
            token,
            expiresIn: config.jwtExpiresIn,
        };
    }

    static async getProfile(userId: string) {
        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: {
                id: true,
                email: true,
                name: true,
                role: true,
                avatar: true,
                createdAt: true,
                lastLoginAt: true,
                _count: {
                    select: {
                        createdInterviews: true,
                        questionsCreated: true,
                        submissions: true,
                    },
                },
            },
        });

        return user;
    }

    static async updateProfile(userId: string, data: { name?: string; avatar?: string }) {
        const user = await prisma.user.update({
            where: { id: userId },
            data,
            select: {
                id: true,
                email: true,
                name: true,
                role: true,
                avatar: true,
            },
        });

        return user;
    }

    static async changePassword(
        userId: string,
        currentPassword: string,
        newPassword: string
    ): Promise<void> {
        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: { password: true },
        });

        if (!user) {
            throw new UnauthorizedError('User not found');
        }

        const isPasswordValid = await bcrypt.compare(currentPassword, user.password);

        if (!isPasswordValid) {
            throw new BadRequestError('Current password is incorrect');
        }

        if (newPassword.length < 8) {
            throw new BadRequestError('New password must be at least 8 characters');
        }

        const hashedPassword = await bcrypt.hash(newPassword, this.SALT_ROUNDS);

        await prisma.user.update({
            where: { id: userId },
            data: { password: hashedPassword },
        });
    }

    private static generateToken(userId: string, email: string, role: string): string {
        const payload: JwtPayload = {
            userId,
            email,
            role: role as any,
        };

        // Use type assertion for SignOptions since jwtExpiresIn can be '7d', '24h', etc.
        const options = { expiresIn: config.jwtExpiresIn } as jwt.SignOptions;
        return jwt.sign(payload, config.jwtSecret, options);
    }
}
