import dotenv from 'dotenv';
import path from 'path';

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

export const config = {
    // Server
    port: parseInt(process.env.PORT || '5000', 10),
    nodeEnv: process.env.NODE_ENV || 'development',
    isDev: process.env.NODE_ENV !== 'production',

    // Database
    databaseUrl: process.env.DATABASE_URL || 'postgresql://localhost:5432/codeview',

    // Redis
    redisUrl: process.env.REDIS_URL || 'redis://localhost:6379',

    // JWT
    jwtSecret: process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-in-production',
    jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',

    // CORS
    corsOrigin: process.env.CORS_ORIGIN || 'http://localhost:3000',

    // Code Execution
    codeExecutionTimeout: parseInt(process.env.CODE_EXECUTION_TIMEOUT || '10000', 10), // 10 seconds
    maxMemoryMB: parseInt(process.env.MAX_MEMORY_MB || '256', 10),

    // Rate Limiting
    rateLimitWindowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '60000', 10), // 1 minute
    rateLimitMax: parseInt(process.env.RATE_LIMIT_MAX || '100', 10),

    // OpenAI (for AI analysis)
    openaiApiKey: process.env.OPENAI_API_KEY || '',

    // Logging
    logLevel: process.env.LOG_LEVEL || 'info',
} as const;

export type Config = typeof config;
