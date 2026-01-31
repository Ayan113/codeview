import { prisma } from '../config/database';
import { NotFoundError, ForbiddenError } from '../utils/errors';

interface CreateNoteInput {
    content: string;
    isPrivate?: boolean;
}

interface UpdateNoteInput {
    content: string;
    isPrivate?: boolean;
}

export class NoteService {
    /**
     * Create a new note for an interview
     */
    static async createNote(interviewId: string, userId: string, input: CreateNoteInput) {
        // Verify interview exists and user has access
        const interview = await prisma.interview.findUnique({
            where: { id: interviewId },
            include: {
                participants: true,
            },
        });

        if (!interview) {
            throw new NotFoundError('Interview not found');
        }

        // Check if user is a participant or creator
        const isParticipant = interview.participants.some((p: any) => p.userId === userId);
        const isCreator = interview.creatorId === userId;

        if (!isParticipant && !isCreator) {
            throw new ForbiddenError('You do not have access to this interview');
        }

        const note = await prisma.interviewNote.create({
            data: {
                interviewId,
                userId,
                content: input.content,
                isPrivate: input.isPrivate ?? true,
            },
            include: {
                user: {
                    select: { id: true, name: true, email: true, avatar: true },
                },
            },
        });

        return note;
    }

    /**
     * Get all notes for an interview
     */
    static async getNotes(interviewId: string, userId: string) {
        // Verify access
        const interview = await prisma.interview.findUnique({
            where: { id: interviewId },
            include: {
                participants: true,
            },
        });

        if (!interview) {
            throw new NotFoundError('Interview not found');
        }

        const isParticipant = interview.participants.some((p: any) => p.userId === userId);
        const isCreator = interview.creatorId === userId;

        if (!isParticipant && !isCreator) {
            throw new ForbiddenError('You do not have access to this interview');
        }

        const notes = await prisma.interviewNote.findMany({
            where: {
                interviewId,
                OR: [
                    { isPrivate: false },
                    { userId },
                ],
            },
            include: {
                user: {
                    select: { id: true, name: true, email: true, avatar: true },
                },
            },
            orderBy: { timestamp: 'asc' },
        });

        return notes;
    }

    /**
     * Get a single note by ID
     */
    static async getNoteById(noteId: string, userId: string) {
        const note = await prisma.interviewNote.findUnique({
            where: { id: noteId },
            include: {
                user: {
                    select: { id: true, name: true, email: true, avatar: true },
                },
                interview: {
                    include: {
                        participants: true,
                    },
                },
            },
        });

        if (!note) {
            throw new NotFoundError('Note not found');
        }

        // Check access - can see if own note, not private, or is interview participant
        const isOwner = note.userId === userId;
        const isParticipant = note.interview.participants.some((p: any) => p.userId === userId);
        const isCreator = note.interview.creatorId === userId;

        if (!isOwner && note.isPrivate && !isCreator) {
            throw new ForbiddenError('You do not have access to this note');
        }

        if (!isParticipant && !isCreator) {
            throw new ForbiddenError('You do not have access to this note');
        }

        return note;
    }

    /**
     * Update a note (only owner can update)
     */
    static async updateNote(noteId: string, userId: string, input: UpdateNoteInput) {
        const note = await prisma.interviewNote.findUnique({
            where: { id: noteId },
        });

        if (!note) {
            throw new NotFoundError('Note not found');
        }

        if (note.userId !== userId) {
            throw new ForbiddenError('Only the author can edit this note');
        }

        const updated = await prisma.interviewNote.update({
            where: { id: noteId },
            data: {
                content: input.content,
                isPrivate: input.isPrivate,
            },
            include: {
                user: {
                    select: { id: true, name: true, email: true, avatar: true },
                },
            },
        });

        return updated;
    }

    /**
     * Delete a note (only owner or interview creator can delete)
     */
    static async deleteNote(noteId: string, userId: string) {
        const note = await prisma.interviewNote.findUnique({
            where: { id: noteId },
            include: {
                interview: true,
            },
        });

        if (!note) {
            throw new NotFoundError('Note not found');
        }

        const isOwner = note.userId === userId;
        const isInterviewCreator = note.interview.creatorId === userId;

        if (!isOwner && !isInterviewCreator) {
            throw new ForbiddenError('You cannot delete this note');
        }

        await prisma.interviewNote.delete({
            where: { id: noteId },
        });
    }

    /**
     * Get interview summary with notes and code submissions
     */
    static async getInterviewSummary(interviewId: string, userId: string) {
        const interview = await prisma.interview.findUnique({
            where: { id: interviewId },
            include: {
                creator: {
                    select: { id: true, name: true, email: true },
                },
                participants: {
                    include: {
                        user: {
                            select: { id: true, name: true, email: true, avatar: true },
                        },
                    },
                },
                notes: {
                    include: {
                        user: {
                            select: { id: true, name: true },
                        },
                    },
                    orderBy: { timestamp: 'asc' },
                },
                submissions: {
                    include: {
                        user: {
                            select: { id: true, name: true },
                        },
                        question: {
                            select: { id: true, title: true, difficulty: true },
                        },
                    },
                    orderBy: { createdAt: 'desc' },
                },
                questions: {
                    include: {
                        question: {
                            select: { id: true, title: true, difficulty: true, category: true },
                        },
                    },
                },
            },
        });

        if (!interview) {
            throw new NotFoundError('Interview not found');
        }

        // Check access
        const isParticipant = interview.participants.some((p: any) => p.userId === userId);
        const isCreator = interview.creatorId === userId;

        if (!isParticipant && !isCreator) {
            throw new ForbiddenError('You do not have access to this interview');
        }

        // Calculate stats
        const totalSubmissions = interview.submissions.length;
        const passedSubmissions = interview.submissions.filter((s: any) => s.status === 'PASSED').length;
        const duration = interview.startedAt && interview.endedAt
            ? Math.round((interview.endedAt.getTime() - interview.startedAt.getTime()) / 60000)
            : null;

        return {
            interview: {
                id: interview.id,
                title: interview.title,
                description: interview.description,
                status: interview.status,
                roomCode: interview.roomCode,
                scheduledAt: interview.scheduledAt,
                startedAt: interview.startedAt,
                endedAt: interview.endedAt,
                durationMinutes: duration,
            },
            creator: interview.creator,
            participants: interview.participants.map((p: any) => ({
                ...p.user,
                role: p.role,
                joinedAt: p.joinedAt,
            })),
            questions: interview.questions.map((q: any) => q.question),
            notes: interview.notes.filter((n: any) => !n.isPrivate || n.userId === userId),
            submissions: {
                total: totalSubmissions,
                passed: passedSubmissions,
                passRate: totalSubmissions > 0 ? Math.round((passedSubmissions / totalSubmissions) * 100) : 0,
                details: interview.submissions,
            },
        };
    }
}
