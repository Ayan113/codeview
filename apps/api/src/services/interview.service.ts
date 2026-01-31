import { prisma } from '../config/database';
import { NotFoundError, ForbiddenError, BadRequestError } from '../utils/errors';
import { v4 as uuidv4 } from 'uuid';
import {
    InterviewStatus,
    InterviewStatusType,
    ParticipantRole,
    ParticipantRoleType
} from '../types/constants';


interface CreateInterviewInput {
    title: string;
    description?: string;
    scheduledAt?: Date;
    duration?: number;
    candidateEmail?: string;
}

interface UpdateInterviewInput {
    title?: string;
    description?: string;
    scheduledAt?: Date;
    duration?: number;
    status?: InterviewStatusType;
}

export class InterviewService {
    static async createInterview(creatorId: string, input: CreateInterviewInput) {
        const roomCode = uuidv4().substring(0, 8).toUpperCase();

        const interview = await prisma.interview.create({
            data: {
                title: input.title,
                description: input.description,
                scheduledAt: input.scheduledAt,
                duration: input.duration || 60,
                roomCode,
                creatorId,
                participants: {
                    create: {
                        userId: creatorId,
                        role: ParticipantRole.HOST,
                    },
                },
            },
            include: {
                creator: {
                    select: { id: true, name: true, email: true, avatar: true },
                },
                participants: {
                    include: {
                        user: {
                            select: { id: true, name: true, email: true, avatar: true },
                        },
                    },
                },
                _count: {
                    select: { questions: true, submissions: true },
                },
            },
        });

        // If candidate email provided, create participant entry
        if (input.candidateEmail) {
            const candidate = await prisma.user.findUnique({
                where: { email: input.candidateEmail.toLowerCase() },
            });

            if (candidate) {
                await prisma.interviewParticipant.create({
                    data: {
                        interviewId: interview.id,
                        userId: candidate.id,
                        role: ParticipantRole.CANDIDATE,
                    },
                });
            }
        }

        return interview;
    }

    static async getInterviews(userId: string, filters?: { status?: InterviewStatusType }) {
        const interviews = await prisma.interview.findMany({
            where: {
                OR: [
                    { creatorId: userId },
                    { participants: { some: { userId } } },
                ],
                ...(filters?.status && { status: filters.status }),
            },
            include: {
                creator: {
                    select: { id: true, name: true, email: true, avatar: true },
                },
                participants: {
                    include: {
                        user: {
                            select: { id: true, name: true, email: true, avatar: true },
                        },
                    },
                },
                _count: {
                    select: { questions: true, submissions: true },
                },
            },
            orderBy: { scheduledAt: 'desc' },
        });

        return interviews;
    }

    static async getInterviewById(interviewId: string, userId: string) {
        const interview = await prisma.interview.findUnique({
            where: { id: interviewId },
            include: {
                creator: {
                    select: { id: true, name: true, email: true, avatar: true },
                },
                participants: {
                    include: {
                        user: {
                            select: { id: true, name: true, email: true, avatar: true },
                        },
                    },
                },
                questions: {
                    include: {
                        question: true,
                    },
                    orderBy: { order: 'asc' },
                },
                _count: {
                    select: { submissions: true, notes: true },
                },
            },
        });

        if (!interview) {
            throw new NotFoundError('Interview not found');
        }

        // Check if user has access
        const isParticipant = interview.participants.some((p) => p.userId === userId);
        const isCreator = interview.creatorId === userId;

        if (!isParticipant && !isCreator) {
            throw new ForbiddenError('You do not have access to this interview');
        }

        return interview;
    }

    static async getInterviewByRoomCode(roomCode: string) {
        const interview = await prisma.interview.findUnique({
            where: { roomCode },
            include: {
                creator: {
                    select: { id: true, name: true, email: true, avatar: true },
                },
                participants: {
                    include: {
                        user: {
                            select: { id: true, name: true, email: true, avatar: true },
                        },
                    },
                },
                questions: {
                    include: {
                        question: true,
                    },
                    orderBy: { order: 'asc' },
                },
            },
        });

        if (!interview) {
            throw new NotFoundError('Interview room not found');
        }

        return interview;
    }

    static async updateInterview(interviewId: string, userId: string, input: UpdateInterviewInput) {
        const interview = await prisma.interview.findUnique({
            where: { id: interviewId },
        });

        if (!interview) {
            throw new NotFoundError('Interview not found');
        }

        if (interview.creatorId !== userId) {
            throw new ForbiddenError('Only the creator can update this interview');
        }

        const updated = await prisma.interview.update({
            where: { id: interviewId },
            data: input,
            include: {
                creator: {
                    select: { id: true, name: true, email: true, avatar: true },
                },
                participants: {
                    include: {
                        user: {
                            select: { id: true, name: true, email: true, avatar: true },
                        },
                    },
                },
            },
        });

        return updated;
    }

    static async startInterview(interviewId: string, userId: string) {
        const interview = await prisma.interview.findUnique({
            where: { id: interviewId },
        });

        if (!interview) {
            throw new NotFoundError('Interview not found');
        }

        if (interview.creatorId !== userId) {
            throw new ForbiddenError('Only the creator can start this interview');
        }

        if (interview.status !== InterviewStatus.SCHEDULED) {
            throw new BadRequestError('Interview cannot be started');
        }

        const updated = await prisma.interview.update({
            where: { id: interviewId },
            data: {
                status: InterviewStatus.IN_PROGRESS,
                startedAt: new Date(),
            },
        });

        return updated;
    }

    static async endInterview(interviewId: string, userId: string) {
        const interview = await prisma.interview.findUnique({
            where: { id: interviewId },
        });

        if (!interview) {
            throw new NotFoundError('Interview not found');
        }

        if (interview.creatorId !== userId) {
            throw new ForbiddenError('Only the creator can end this interview');
        }

        if (interview.status !== InterviewStatus.IN_PROGRESS) {
            throw new BadRequestError('Interview is not in progress');
        }

        const updated = await prisma.interview.update({
            where: { id: interviewId },
            data: {
                status: InterviewStatus.COMPLETED,
                endedAt: new Date(),
            },
        });

        return updated;
    }

    static async deleteInterview(interviewId: string, userId: string) {
        const interview = await prisma.interview.findUnique({
            where: { id: interviewId },
        });

        if (!interview) {
            throw new NotFoundError('Interview not found');
        }

        if (interview.creatorId !== userId) {
            throw new ForbiddenError('Only the creator can delete this interview');
        }

        await prisma.interview.delete({
            where: { id: interviewId },
        });
    }

    static async addParticipant(
        interviewId: string,
        userId: string,
        role: ParticipantRoleType = ParticipantRole.CANDIDATE
    ) {
        // Check if already a participant
        const existing = await prisma.interviewParticipant.findUnique({
            where: {
                interviewId_userId: {
                    interviewId,
                    userId,
                },
            },
        });

        if (existing) {
            return existing;
        }

        const participant = await prisma.interviewParticipant.create({
            data: {
                interviewId,
                userId,
                role,
            },
            include: {
                user: {
                    select: { id: true, name: true, email: true, avatar: true },
                },
            },
        });

        return participant;
    }

    static async addQuestionToInterview(interviewId: string, questionId: string, userId: string) {
        const interview = await prisma.interview.findUnique({
            where: { id: interviewId },
        });

        if (!interview) {
            throw new NotFoundError('Interview not found');
        }

        if (interview.creatorId !== userId) {
            throw new ForbiddenError('Only the creator can add questions');
        }

        // Get current max order
        const maxOrder = await prisma.interviewQuestion.aggregate({
            where: { interviewId },
            _max: { order: true },
        });

        const interviewQuestion = await prisma.interviewQuestion.create({
            data: {
                interviewId,
                questionId,
                order: (maxOrder._max.order || 0) + 1,
            },
            include: {
                question: true,
            },
        });

        return interviewQuestion;
    }
}
