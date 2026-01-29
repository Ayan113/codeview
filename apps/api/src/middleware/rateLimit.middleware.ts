import rateLimit from 'express-rate-limit';
import { config } from '../config';

// General API rate limiter
export const apiLimiter = rateLimit({
    windowMs: config.rateLimitWindowMs,
    max: config.rateLimitMax,
    message: {
        success: false,
        error: {
            code: 'RATE_LIMIT_EXCEEDED',
            message: 'Too many requests, please try again later',
        },
    },
    standardHeaders: true,
    legacyHeaders: false,
});

// Stricter limiter for auth endpoints
export const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 10, // 10 attempts per window
    message: {
        success: false,
        error: {
            code: 'AUTH_RATE_LIMIT_EXCEEDED',
            message: 'Too many authentication attempts, please try again later',
        },
    },
    standardHeaders: true,
    legacyHeaders: false,
});

// Limiter for code execution (expensive operation)
export const executionLimiter = rateLimit({
    windowMs: 60 * 1000, // 1 minute
    max: 20, // 20 executions per minute
    message: {
        success: false,
        error: {
            code: 'EXECUTION_RATE_LIMIT_EXCEEDED',
            message: 'Too many code executions, please slow down',
        },
    },
    standardHeaders: true,
    legacyHeaders: false,
});
