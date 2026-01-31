import { Request, Response, NextFunction } from 'express';
import { InterviewService } from '../services/interview.service';
import { InterviewStatus, InterviewStatusType } from '../types/constants';
import { z } from 'zod';

// Validation schemas
export const createInterviewSchema = z.object({
    title: z.string().min(3, 'Title must be at least 3 characters').max(200),
    description: z.string().max(2000).optional(),
    scheduledAt: z.string().datetime().optional().transform((val) => val ? new Date(val) : undefined),
    duration: z.number().min(15).max(480).optional(),
    candidateEmail: z.string().email().optional(),
});

export const updateInterviewSchema = z.object({
    title: z.string().min(3).max(200).optional(),
    description: z.string().max(2000).optional(),
    scheduledAt: z.string().datetime().optional().transform((val) => val ? new Date(val) : undefined),
    duration: z.number().min(15).max(480).optional(),
    status: z.enum(['SCHEDULED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED']).optional(),
});

export const addQuestionSchema = z.object({
    questionId: z.string().cuid(),
});

export class InterviewController {
    static async createInterview(req: Request, res: Response, next: NextFunction) {
        try {
            const interview = await InterviewService.createInterview(req.user!.id, req.body);

            res.status(201).json({
                success: true,
                data: interview,
            });
        } catch (error) {
            next(error);
        }
    }

    static async getInterviews(req: Request, res: Response, next: NextFunction) {
        try {
            const status = req.query.status as InterviewStatusType | undefined;
            const interviews = await InterviewService.getInterviews(req.user!.id, { status });

            res.json({
                success: true,
                data: interviews,
                count: interviews.length,
            });
        } catch (error) {
            next(error);
        }
    }

    static async getInterviewById(req: Request, res: Response, next: NextFunction) {
        try {
            const interview = await InterviewService.getInterviewById(req.params.id, req.user!.id);

            res.json({
                success: true,
                data: interview,
            });
        } catch (error) {
            next(error);
        }
    }

    static async getInterviewByRoomCode(req: Request, res: Response, next: NextFunction) {
        try {
            const interview = await InterviewService.getInterviewByRoomCode(req.params.roomCode);

            res.json({
                success: true,
                data: interview,
            });
        } catch (error) {
            next(error);
        }
    }

    static async updateInterview(req: Request, res: Response, next: NextFunction) {
        try {
            const interview = await InterviewService.updateInterview(
                req.params.id,
                req.user!.id,
                req.body
            );

            res.json({
                success: true,
                data: interview,
            });
        } catch (error) {
            next(error);
        }
    }

    static async startInterview(req: Request, res: Response, next: NextFunction) {
        try {
            const interview = await InterviewService.startInterview(req.params.id, req.user!.id);

            res.json({
                success: true,
                data: interview,
                message: 'Interview started',
            });
        } catch (error) {
            next(error);
        }
    }

    static async endInterview(req: Request, res: Response, next: NextFunction) {
        try {
            const interview = await InterviewService.endInterview(req.params.id, req.user!.id);

            res.json({
                success: true,
                data: interview,
                message: 'Interview ended',
            });
        } catch (error) {
            next(error);
        }
    }

    static async deleteInterview(req: Request, res: Response, next: NextFunction) {
        try {
            await InterviewService.deleteInterview(req.params.id, req.user!.id);

            res.json({
                success: true,
                message: 'Interview deleted',
            });
        } catch (error) {
            next(error);
        }
    }

    static async addQuestion(req: Request, res: Response, next: NextFunction) {
        try {
            const interviewQuestion = await InterviewService.addQuestionToInterview(
                req.params.id,
                req.body.questionId,
                req.user!.id
            );

            res.status(201).json({
                success: true,
                data: interviewQuestion,
            });
        } catch (error) {
            next(error);
        }
    }

    static async joinInterview(req: Request, res: Response, next: NextFunction) {
        try {
            const participant = await InterviewService.addParticipant(
                req.params.id,
                req.user!.id
            );

            res.json({
                success: true,
                data: participant,
                message: 'Joined interview',
            });
        } catch (error) {
            next(error);
        }
    }
}
