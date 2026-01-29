import { Request, Response, NextFunction } from 'express';
import { AppError, ValidationError } from '../utils/errors';
import logger from '../utils/logger';
import { config } from '../config';

export function errorHandler(
    err: Error,
    req: Request,
    res: Response,
    _next: NextFunction
): void {
    // Log error
    logger.error({
        err,
        method: req.method,
        url: req.url,
        userId: req.user?.id,
    });

    // Handle known errors
    if (err instanceof ValidationError) {
        res.status(err.statusCode).json({
            success: false,
            error: {
                code: err.code,
                message: err.message,
                errors: err.errors,
            },
        });
        return;
    }

    if (err instanceof AppError) {
        res.status(err.statusCode).json({
            success: false,
            error: {
                code: err.code,
                message: err.message,
            },
        });
        return;
    }

    // Handle Prisma errors
    if (err.name === 'PrismaClientKnownRequestError') {
        res.status(400).json({
            success: false,
            error: {
                code: 'DATABASE_ERROR',
                message: 'Database operation failed',
            },
        });
        return;
    }

    // Unknown errors
    res.status(500).json({
        success: false,
        error: {
            code: 'INTERNAL_ERROR',
            message: config.isDev ? err.message : 'An unexpected error occurred',
            ...(config.isDev && { stack: err.stack }),
        },
    });
}

export function notFoundHandler(req: Request, res: Response): void {
    res.status(404).json({
        success: false,
        error: {
            code: 'NOT_FOUND',
            message: `Route ${req.method} ${req.path} not found`,
        },
    });
}
