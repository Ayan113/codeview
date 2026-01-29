import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { createServer } from 'http';
import pinoHttp from 'pino-http';

import { config } from './config';
import { connectDatabase, disconnectDatabase } from './config/database';
import routes from './routes';
import { errorHandler, notFoundHandler } from './middleware/error.middleware';
import { apiLimiter } from './middleware/rateLimit.middleware';
import { initializeSocket } from './socket';
import logger from './utils/logger';

// Create Express app
const app = express();
const httpServer = createServer(app);

// Initialize Socket.io
initializeSocket(httpServer);

// Security middleware
app.use(helmet({
    crossOriginEmbedderPolicy: false,
    crossOriginResourcePolicy: { policy: 'cross-origin' },
}));

// CORS
app.use(cors({
    origin: config.corsOrigin,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
}));

// Request logging
app.use(pinoHttp({
    logger,
    autoLogging: config.isDev,
}));

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Rate limiting
app.use('/api', apiLimiter);

// API routes
app.use('/api', routes);

// Root route
app.get('/', (_req, res) => {
    res.json({
        success: true,
        data: {
            name: 'CodeView API',
            version: '1.0.0',
            description: 'Real-Time Collaborative Code Interview Platform',
            docs: '/api/health',
        },
    });
});

// Error handling
app.use(notFoundHandler);
app.use(errorHandler);

// Graceful shutdown
async function shutdown(): Promise<void> {
    logger.info('Shutting down...');

    httpServer.close(() => {
        logger.info('HTTP server closed');
    });

    await disconnectDatabase();
    process.exit(0);
}

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);

// Start server
async function start(): Promise<void> {
    try {
        // Connect to database
        await connectDatabase();

        // Start HTTP server
        httpServer.listen(config.port, () => {
            logger.info(`🚀 Server running on http://localhost:${config.port}`);
            logger.info(`📊 Environment: ${config.nodeEnv}`);
            logger.info(`🔗 CORS Origin: ${config.corsOrigin}`);
        });
    } catch (error) {
        logger.error({ error }, 'Failed to start server');
        process.exit(1);
    }
}

start();

export { app, httpServer };
