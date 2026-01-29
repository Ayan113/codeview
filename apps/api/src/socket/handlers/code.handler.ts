import { Server as SocketServer, Socket } from 'socket.io';
import { prisma } from '../../config/database';
import logger from '../../utils/logger';

interface CodeChangePayload {
    roomId: string;
    code: string;
    language: string;
    cursorPosition?: { line: number; column: number };
}

interface CursorMovePayload {
    roomId: string;
    position: { line: number; column: number };
    selection?: { start: { line: number; column: number }; end: { line: number; column: number } };
}

export function codeHandler(io: SocketServer, socket: Socket): void {
    const userId = socket.data.user?.id;
    const userName = socket.data.user?.email?.split('@')[0] || 'Anonymous';

    // Join interview room
    socket.on('join-room', async (roomId: string) => {
        try {
            socket.join(roomId);
            socket.data.currentRoom = roomId;

            // Notify others in the room
            socket.to(roomId).emit('user-joined', {
                userId,
                userName,
                timestamp: new Date().toISOString(),
            });

            logger.info({ userId, roomId }, 'User joined room');

            // Send current participants count
            const roomSockets = await io.in(roomId).fetchSockets();
            io.to(roomId).emit('room-participants', {
                count: roomSockets.length,
            });
        } catch (error) {
            logger.error({ userId, roomId, error }, 'Error joining room');
            socket.emit('error', { message: 'Failed to join room' });
        }
    });

    // Leave interview room
    socket.on('leave-room', (roomId: string) => {
        socket.leave(roomId);
        socket.data.currentRoom = null;

        socket.to(roomId).emit('user-left', {
            userId,
            userName,
            timestamp: new Date().toISOString(),
        });

        logger.info({ userId, roomId }, 'User left room');
    });

    // Code change event
    socket.on('code-change', async (payload: CodeChangePayload) => {
        const { roomId, code, language, cursorPosition } = payload;

        // Broadcast to all other users in the room
        socket.to(roomId).emit('code-update', {
            userId,
            userName,
            code,
            language,
            cursorPosition,
            timestamp: new Date().toISOString(),
        });

        // Save snapshot periodically (debounced on client, every 30 seconds)
        if (socket.data.lastSnapshot && Date.now() - socket.data.lastSnapshot < 30000) {
            return;
        }

        try {
            // Get interview by room code
            const interview = await prisma.interview.findUnique({
                where: { roomCode: roomId },
            });

            if (interview) {
                await prisma.codeSnapshot.create({
                    data: {
                        interviewId: interview.id,
                        code,
                        language,
                    },
                });
                socket.data.lastSnapshot = Date.now();
            }
        } catch (error) {
            logger.error({ error }, 'Error saving code snapshot');
        }
    });

    // Cursor position update
    socket.on('cursor-move', (payload: CursorMovePayload) => {
        const { roomId, position, selection } = payload;

        socket.to(roomId).emit('cursor-update', {
            userId,
            userName,
            position,
            selection,
            timestamp: new Date().toISOString(),
        });
    });

    // Typing indicator
    socket.on('typing-start', (roomId: string) => {
        socket.to(roomId).emit('user-typing', {
            userId,
            userName,
            isTyping: true,
        });
    });

    socket.on('typing-stop', (roomId: string) => {
        socket.to(roomId).emit('user-typing', {
            userId,
            userName,
            isTyping: false,
        });
    });

    // Language change
    socket.on('language-change', (payload: { roomId: string; language: string }) => {
        socket.to(payload.roomId).emit('language-update', {
            userId,
            userName,
            language: payload.language,
            timestamp: new Date().toISOString(),
        });
    });

    // Handle disconnection for room cleanup
    socket.on('disconnect', async () => {
        const roomId = socket.data.currentRoom;
        if (roomId) {
            socket.to(roomId).emit('user-left', {
                userId,
                userName,
                timestamp: new Date().toISOString(),
            });

            // Update participant count
            const roomSockets = await io.in(roomId).fetchSockets();
            io.to(roomId).emit('room-participants', {
                count: roomSockets.length,
            });
        }
    });
}
