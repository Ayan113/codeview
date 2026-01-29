import { Server as SocketServer, Socket } from 'socket.io';
import logger from '../../utils/logger';

interface PresenceMap {
    [roomId: string]: {
        [userId: string]: {
            name: string;
            isOnline: boolean;
            lastSeen: string;
            cursorPosition?: { line: number; column: number };
        };
    };
}

// In-memory presence store (use Redis in production)
const presence: PresenceMap = {};

export function presenceHandler(io: SocketServer, socket: Socket): void {
    const userId = socket.data.user?.id;
    const userName = socket.data.user?.email?.split('@')[0] || 'Anonymous';

    // Update presence when joining room
    socket.on('presence-join', (roomId: string) => {
        if (!presence[roomId]) {
            presence[roomId] = {};
        }

        presence[roomId][userId] = {
            name: userName,
            isOnline: true,
            lastSeen: new Date().toISOString(),
        };

        // Broadcast updated presence to all in room
        io.to(roomId).emit('presence-sync', {
            users: Object.entries(presence[roomId]).map(([id, data]) => ({
                userId: id,
                ...data,
            })),
        });

        logger.debug({ userId, roomId }, 'Presence updated');
    });

    // Update presence when leaving room
    socket.on('presence-leave', (roomId: string) => {
        if (presence[roomId] && presence[roomId][userId]) {
            presence[roomId][userId].isOnline = false;
            presence[roomId][userId].lastSeen = new Date().toISOString();

            // Broadcast updated presence
            io.to(roomId).emit('presence-sync', {
                users: Object.entries(presence[roomId]).map(([id, data]) => ({
                    userId: id,
                    ...data,
                })),
            });
        }
    });

    // Get current presence for a room
    socket.on('presence-get', (roomId: string) => {
        const roomPresence = presence[roomId] || {};

        socket.emit('presence-sync', {
            users: Object.entries(roomPresence).map(([id, data]) => ({
                userId: id,
                ...data,
            })),
        });
    });

    // Update cursor position for presence
    socket.on('presence-cursor', (payload: { roomId: string; position: { line: number; column: number } }) => {
        const { roomId, position } = payload;

        if (presence[roomId] && presence[roomId][userId]) {
            presence[roomId][userId].cursorPosition = position;
            presence[roomId][userId].lastSeen = new Date().toISOString();

            // Don't emit full sync for cursor updates, handled by code handler
        }
    });

    // Handle disconnection
    socket.on('disconnect', () => {
        // Update presence in all rooms this user was in
        for (const roomId of Object.keys(presence)) {
            if (presence[roomId] && presence[roomId][userId]) {
                presence[roomId][userId].isOnline = false;
                presence[roomId][userId].lastSeen = new Date().toISOString();

                io.to(roomId).emit('presence-sync', {
                    users: Object.entries(presence[roomId]).map(([id, data]) => ({
                        userId: id,
                        ...data,
                    })),
                });
            }
        }
    });

    // Heartbeat to keep presence alive
    socket.on('presence-heartbeat', (roomId: string) => {
        if (presence[roomId] && presence[roomId][userId]) {
            presence[roomId][userId].lastSeen = new Date().toISOString();
            presence[roomId][userId].isOnline = true;
        }
    });
}

// Clean up stale presence entries (run periodically)
export function cleanupStalePresence(maxAgeMs: number = 300000): void {
    const now = Date.now();

    for (const roomId of Object.keys(presence)) {
        for (const userId of Object.keys(presence[roomId])) {
            const lastSeen = new Date(presence[roomId][userId].lastSeen).getTime();

            if (now - lastSeen > maxAgeMs) {
                delete presence[roomId][userId];
            }
        }

        // Remove empty rooms
        if (Object.keys(presence[roomId]).length === 0) {
            delete presence[roomId];
        }
    }
}
