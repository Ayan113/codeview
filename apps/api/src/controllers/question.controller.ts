import { Request, Response, NextFunction } from 'express';
import { QuestionService } from '../services/question.service';
import { Difficulty, DifficultyType } from '../types/constants';
import { z } from 'zod';

// Validation schemas
export const createQuestionSchema = z.object({
    title: z.string().min(3, 'Title must be at least 3 characters').max(200),
    description: z.string().min(10, 'Description must be at least 10 characters').max(10000),
    difficulty: z.enum(['EASY', 'MEDIUM', 'HARD']),
    category: z.string().min(2).max(50),
    tags: z.array(z.string().max(30)).max(10).optional(),
    starterCode: z.record(z.string()).optional(),
    testCases: z.array(z.object({
        input: z.string(),
        expectedOutput: z.string(),
        isHidden: z.boolean().optional(),
    })).optional(),
    solution: z.string().optional(),
    hints: z.array(z.string().max(500)).max(5).optional(),
    timeLimit: z.number().min(5).max(120).optional(),
    isPublic: z.boolean().optional(),
});

export const updateQuestionSchema = createQuestionSchema.partial();

export const questionFiltersSchema = z.object({
    difficulty: z.enum(['EASY', 'MEDIUM', 'HARD']).optional(),
    category: z.string().optional(),
    search: z.string().optional(),
    tags: z.string().optional().transform((val) => val?.split(',').filter(Boolean)),
});

export class QuestionController {
    static async createQuestion(req: Request, res: Response, next: NextFunction) {
        try {
            const question = await QuestionService.createQuestion(req.user!.id, req.body);

            res.status(201).json({
                success: true,
                data: question,
            });
        } catch (error) {
            next(error);
        }
    }

    static async getQuestions(req: Request, res: Response, next: NextFunction) {
        try {
            const filters = {
                difficulty: req.query.difficulty as DifficultyType | undefined,
                category: req.query.category as string | undefined,
                search: req.query.search as string | undefined,
                tags: req.query.tags ? (req.query.tags as string).split(',') : undefined,
            };

            const questions = await QuestionService.getQuestions(req.user!.id, filters);

            res.json({
                success: true,
                data: questions,
                count: questions.length,
            });
        } catch (error) {
            next(error);
        }
    }

    static async getQuestionById(req: Request, res: Response, next: NextFunction) {
        try {
            const question = await QuestionService.getQuestionById(req.params.id, req.user!.id);

            res.json({
                success: true,
                data: question,
            });
        } catch (error) {
            next(error);
        }
    }

    static async updateQuestion(req: Request, res: Response, next: NextFunction) {
        try {
            const question = await QuestionService.updateQuestion(
                req.params.id,
                req.user!.id,
                req.body
            );

            res.json({
                success: true,
                data: question,
            });
        } catch (error) {
            next(error);
        }
    }

    static async deleteQuestion(req: Request, res: Response, next: NextFunction) {
        try {
            await QuestionService.deleteQuestion(req.params.id, req.user!.id);

            res.json({
                success: true,
                message: 'Question deleted',
            });
        } catch (error) {
            next(error);
        }
    }

    static async getCategories(_req: Request, res: Response, next: NextFunction) {
        try {
            const categories = await QuestionService.getCategories();

            res.json({
                success: true,
                data: categories,
            });
        } catch (error) {
            next(error);
        }
    }

    static async getTags(_req: Request, res: Response, next: NextFunction) {
        try {
            const tags = await QuestionService.getTags();

            res.json({
                success: true,
                data: tags,
            });
        } catch (error) {
            next(error);
        }
    }
}
