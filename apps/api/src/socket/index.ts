import { Server as SocketServer, Socket } from 'socket.io';
import { Server as HttpServer } from 'http';
import { config } from '../config';
import { getRedisClient } from '../config/redis';
import { createAdapter } from '@socket.io/redis-adapter';
import { codeHandler } from './handlers/code.handler';
import { presenceHandler } from './handlers/presence.handler';
import logger from '../utils/logger';
import jwt from 'jsonwebtoken';
import { JwtPayload } from '../middleware/auth.middleware';

let io: SocketServer | null = null;

export function getSocketServer(): SocketServer | null {
    return io;
}

export function initializeSocket(httpServer: HttpServer): SocketServer {
    io = new SocketServer(httpServer, {
        cors: {
            origin: config.corsOrigin,
            methods: ['GET', 'POST'],
            credentials: true,
        },
        transports: ['websocket', 'polling'],
    });

    // Initialize Redis adapter for scaling
    if (!config.isDev) {
        const pubClient = getRedisClient();
        const subClient = pubClient.duplicate();
        io.adapter(createAdapter(pubClient, subClient));
        logger.info('Socket.io Redis adapter initialized');
    }

    // Authentication middleware
    io.use(async (socket, next) => {
        try {
            const token = socket.handshake.auth.token || socket.handshake.headers.authorization?.split(' ')[1];

            if (!token) {
                return next(new Error('Authentication required'));
            }

            const decoded = jwt.verify(token, config.jwtSecret) as JwtPayload;
            socket.data.user = {
                id: decoded.userId,
                email: decoded.email,
                role: decoded.role,
            };

            next();
        } catch (error) {
            next(new Error('Invalid token'));
        }
    });

    // Connection handler
    io.on('connection', (socket: Socket) => {
        const userId = socket.data.user?.id;
        logger.info({ userId, socketId: socket.id }, 'User connected');

        // Register handlers
        codeHandler(io!, socket);
        presenceHandler(io!, socket);

        // Handle disconnection
        socket.on('disconnect', (reason) => {
            logger.info({ userId, socketId: socket.id, reason }, 'User disconnected');
        });

        // Handle errors
        socket.on('error', (error) => {
            logger.error({ userId, socketId: socket.id, error }, 'Socket error');
        });
    });

    logger.info('Socket.io server initialized');
    return io;
}

// Helper to emit to a specific room
export function emitToRoom(roomId: string, event: string, data: any): void {
    io?.to(roomId).emit(event, data);
}

// Helper to emit to a specific user
export function emitToUser(userId: string, event: string, data: any): void {
    io?.to(`user:${userId}`).emit(event, data);
}
