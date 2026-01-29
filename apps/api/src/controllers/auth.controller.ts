import { Request, Response, NextFunction } from 'express';
import { AuthService } from '../services/auth.service';
import { z } from 'zod';

// Validation schemas
export const registerSchema = z.object({
    email: z.string().email('Invalid email address'),
    password: z.string().min(8, 'Password must be at least 8 characters'),
    name: z.string().min(2, 'Name must be at least 2 characters').max(100),
});

export const loginSchema = z.object({
    email: z.string().email('Invalid email address'),
    password: z.string().min(1, 'Password is required'),
});

export const updateProfileSchema = z.object({
    name: z.string().min(2).max(100).optional(),
    avatar: z.string().url().optional(),
});

export const changePasswordSchema = z.object({
    currentPassword: z.string().min(1, 'Current password is required'),
    newPassword: z.string().min(8, 'New password must be at least 8 characters'),
});

export class AuthController {
    static async register(req: Request, res: Response, next: NextFunction) {
        try {
            const result = await AuthService.register(req.body);

            res.status(201).json({
                success: true,
                data: result,
            });
        } catch (error) {
            next(error);
        }
    }

    static async login(req: Request, res: Response, next: NextFunction) {
        try {
            const result = await AuthService.login(req.body);

            res.json({
                success: true,
                data: result,
            });
        } catch (error) {
            next(error);
        }
    }

    static async getProfile(req: Request, res: Response, next: NextFunction) {
        try {
            const user = await AuthService.getProfile(req.user!.id);

            res.json({
                success: true,
                data: user,
            });
        } catch (error) {
            next(error);
        }
    }

    static async updateProfile(req: Request, res: Response, next: NextFunction) {
        try {
            const user = await AuthService.updateProfile(req.user!.id, req.body);

            res.json({
                success: true,
                data: user,
            });
        } catch (error) {
            next(error);
        }
    }

    static async changePassword(req: Request, res: Response, next: NextFunction) {
        try {
            await AuthService.changePassword(
                req.user!.id,
                req.body.currentPassword,
                req.body.newPassword
            );

            res.json({
                success: true,
                message: 'Password changed successfully',
            });
        } catch (error) {
            next(error);
        }
    }

    static async logout(_req: Request, res: Response) {
        // For JWT, logout is handled client-side by removing the token
        // This endpoint is for future session-based auth or token blacklisting
        res.json({
            success: true,
            message: 'Logged out successfully',
        });
    }
}
