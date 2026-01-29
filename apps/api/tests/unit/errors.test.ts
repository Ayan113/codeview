import { BadRequestError, ConflictError, UnauthorizedError, NotFoundError, AppError, ValidationError } from '../../src/utils/errors';

describe('Custom Error Classes', () => {
    describe('AppError', () => {
        it('should create an error with default values', () => {
            const error = new AppError('Test error');
            expect(error.message).toBe('Test error');
            expect(error.statusCode).toBe(500);
            expect(error.code).toBe('INTERNAL_ERROR');
            expect(error.isOperational).toBe(true);
        });

        it('should create an error with custom values', () => {
            const error = new AppError('Custom error', 400, 'CUSTOM_CODE', false);
            expect(error.message).toBe('Custom error');
            expect(error.statusCode).toBe(400);
            expect(error.code).toBe('CUSTOM_CODE');
            expect(error.isOperational).toBe(false);
        });
    });

    describe('NotFoundError', () => {
        it('should create a 404 error with default message', () => {
            const error = new NotFoundError();
            expect(error.message).toBe('Resource not found');
            expect(error.statusCode).toBe(404);
            expect(error.code).toBe('NOT_FOUND');
        });

        it('should create a 404 error with custom message', () => {
            const error = new NotFoundError('User not found');
            expect(error.message).toBe('User not found');
            expect(error.statusCode).toBe(404);
        });
    });

    describe('UnauthorizedError', () => {
        it('should create a 401 error', () => {
            const error = new UnauthorizedError();
            expect(error.statusCode).toBe(401);
            expect(error.code).toBe('UNAUTHORIZED');
        });
    });

    describe('BadRequestError', () => {
        it('should create a 400 error', () => {
            const error = new BadRequestError('Invalid input');
            expect(error.message).toBe('Invalid input');
            expect(error.statusCode).toBe(400);
            expect(error.code).toBe('BAD_REQUEST');
        });
    });

    describe('ConflictError', () => {
        it('should create a 409 error', () => {
            const error = new ConflictError('Email already exists');
            expect(error.message).toBe('Email already exists');
            expect(error.statusCode).toBe(409);
            expect(error.code).toBe('CONFLICT');
        });
    });

    describe('ValidationError', () => {
        it('should create a 422 error with field errors', () => {
            const errors = {
                email: ['Invalid email format'],
                password: ['Too short', 'Missing special character'],
            };
            const error = new ValidationError(errors);
            expect(error.statusCode).toBe(422);
            expect(error.code).toBe('VALIDATION_ERROR');
            expect(error.errors).toEqual(errors);
        });
    });
});
