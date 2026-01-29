import { io, Socket } from 'socket.io-client';

const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:5000';

let socket: Socket | null = null;

export function getSocket(): Socket | null {
    return socket;
}

export function initializeSocket(token: string): Socket {
    if (socket?.connected) {
        return socket;
    }

    socket = io(SOCKET_URL, {
        auth: { token },
        transports: ['websocket', 'polling'],
        reconnection: true,
        reconnectionAttempts: 5,
        reconnectionDelay: 1000,
    });

    socket.on('connect', () => {
        console.log('Socket connected:', socket?.id);
    });

    socket.on('connect_error', (error) => {
        console.error('Socket connection error:', error.message);
    });

    socket.on('disconnect', (reason) => {
        console.log('Socket disconnected:', reason);
    });

    return socket;
}

export function disconnectSocket(): void {
    if (socket) {
        socket.disconnect();
        socket = null;
    }
}

// Room management
export function joinRoom(roomId: string): void {
    socket?.emit('join-room', roomId);
    socket?.emit('presence-join', roomId);
}

export function leaveRoom(roomId: string): void {
    socket?.emit('leave-room', roomId);
    socket?.emit('presence-leave', roomId);
}

// Code sync
export function emitCodeChange(roomId: string, code: string, language: string, cursorPosition?: { line: number; column: number }): void {
    socket?.emit('code-change', { roomId, code, language, cursorPosition });
}

export function emitCursorMove(roomId: string, position: { line: number; column: number }, selection?: any): void {
    socket?.emit('cursor-move', { roomId, position, selection });
}

export function emitLanguageChange(roomId: string, language: string): void {
    socket?.emit('language-change', { roomId, language });
}

// Typing indicators
export function emitTypingStart(roomId: string): void {
    socket?.emit('typing-start', roomId);
}

export function emitTypingStop(roomId: string): void {
    socket?.emit('typing-stop', roomId);
}

// Presence
export function emitHeartbeat(roomId: string): void {
    socket?.emit('presence-heartbeat', roomId);
}

export function getPresence(roomId: string): void {
    socket?.emit('presence-get', roomId);
}
