import { Request, Response, NextFunction } from 'express';
import { CodeExecutionService } from '../services/execution.service';
import { prisma } from '../config/database';
import { NotFoundError, BadRequestError } from '../utils/errors';
import { z } from 'zod';

export const executeCodeSchema = z.object({
    code: z.string().min(1, 'Code is required').max(50000, 'Code too long'),
    language: z.enum(['javascript', 'python', 'typescript']),
    input: z.string().optional(),
    interviewId: z.string().cuid().optional(),
    questionId: z.string().cuid().optional(),
});

export const runTestsSchema = z.object({
    code: z.string().min(1, 'Code is required').max(50000, 'Code too long'),
    language: z.enum(['javascript', 'python', 'typescript']),
    questionId: z.string().cuid(),
});

export class ExecutionController {
    static async executeCode(req: Request, res: Response, next: NextFunction) {
        try {
            const { code, language, input, interviewId, questionId } = req.body;

            const result = await CodeExecutionService.execute({
                code,
                language,
                input,
            });

            // Save submission if in interview context
            if (interviewId && questionId && req.user) {
                await prisma.submission.create({
                    data: {
                        interviewId,
                        questionId,
                        userId: req.user.id,
                        code,
                        language,
                        status: result.success ? 'PASSED' : 'ERROR',
                        output: result.output,
                        error: result.error,
                        executionTime: result.executionTime,
                    },
                });
            }

            res.json({
                success: true,
                data: {
                    success: result.success,
                    output: result.output,
                    error: result.error,
                    executionTime: result.executionTime,
                },
            });
        } catch (error) {
            next(error);
        }
    }

    static async runTests(req: Request, res: Response, next: NextFunction) {
        try {
            const { code, language, questionId } = req.body;

            // Get question with test cases
            const question = await prisma.question.findUnique({
                where: { id: questionId },
                select: { testCases: true, title: true },
            });

            if (!question) {
                throw new NotFoundError('Question not found');
            }

            const testCases = question.testCases as Array<{ input: string; expectedOutput: string }>;

            if (!testCases || testCases.length === 0) {
                throw new BadRequestError('Question has no test cases');
            }

            const results = await CodeExecutionService.validateTestCases(code, language, testCases);

            res.json({
                success: true,
                data: {
                    questionTitle: question.title,
                    totalTests: testCases.length,
                    passed: results.passed,
                    failed: results.failed,
                    passRate: Math.round((results.passed / testCases.length) * 100),
                    results: results.results,
                },
            });
        } catch (error) {
            next(error);
        }
    }

    static async getSubmissions(req: Request, res: Response, next: NextFunction) {
        try {
            const { interviewId } = req.params;

            const submissions = await prisma.submission.findMany({
                where: { interviewId },
                include: {
                    user: {
                        select: { id: true, name: true, email: true },
                    },
                    question: {
                        select: { id: true, title: true, difficulty: true },
                    },
                },
                orderBy: { createdAt: 'desc' },
            });

            res.json({
                success: true,
                data: submissions,
                count: submissions.length,
            });
        } catch (error) {
            next(error);
        }
    }
}
