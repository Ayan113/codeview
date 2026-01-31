import { prisma } from '../config/database';
import { NotFoundError, ForbiddenError } from '../utils/errors';
import { DifficultyType } from '../types/constants';

interface CreateQuestionInput {
    title: string;
    description: string;
    difficulty: DifficultyType;
    category: string;
    tags?: string[];
    starterCode?: Record<string, string>;
    testCases?: Array<{ input: string; expectedOutput: string; isHidden?: boolean }>;
    solution?: string;
    hints?: string[];
    timeLimit?: number;
    isPublic?: boolean;
}

interface UpdateQuestionInput {
    title?: string;
    description?: string;
    difficulty?: DifficultyType;
    category?: string;
    tags?: string[];
    starterCode?: Record<string, string>;
    testCases?: Array<{ input: string; expectedOutput: string; isHidden?: boolean }>;
    solution?: string;
    hints?: string[];
    timeLimit?: number;
    isPublic?: boolean;
}

interface QuestionFilters {
    difficulty?: DifficultyType;
    category?: string;
    search?: string;
    tags?: string[];
}

export class QuestionService {
    static async createQuestion(creatorId: string, input: CreateQuestionInput) {
        const question = await prisma.question.create({
            data: {
                title: input.title,
                description: input.description,
                difficulty: input.difficulty,
                category: input.category,
                tags: JSON.stringify(input.tags || []),
                starterCode: JSON.stringify(input.starterCode || {
                    javascript: '// Write your solution here\nfunction solution() {\n  \n}\n',
                    python: '# Write your solution here\ndef solution():\n    pass\n',
                    java: '// Write your solution here\nclass Solution {\n    public void solution() {\n        \n    }\n}\n',
                    cpp: '// Write your solution here\n#include <iostream>\n\nint main() {\n    return 0;\n}\n',
                }),
                testCases: JSON.stringify(input.testCases || []),
                solution: input.solution,
                hints: JSON.stringify(input.hints || []),
                timeLimit: input.timeLimit || 30,
                isPublic: input.isPublic ?? true,
                creatorId,
            },
            include: {
                creator: {
                    select: { id: true, name: true, email: true },
                },
                _count: {
                    select: { interviews: true, submissions: true },
                },
            },
        });

        return question;
    }

    static async getQuestions(userId: string, filters?: QuestionFilters) {
        const where: any = {
            OR: [
                { isPublic: true },
                { creatorId: userId },
            ],
        };

        if (filters?.difficulty) {
            where.difficulty = filters.difficulty;
        }

        if (filters?.category) {
            where.category = filters.category;
        }

        if (filters?.tags && filters.tags.length > 0) {
            where.tags = { hasSome: filters.tags };
        }

        if (filters?.search) {
            where.OR = [
                { title: { contains: filters.search, mode: 'insensitive' } },
                { description: { contains: filters.search, mode: 'insensitive' } },
            ];
        }

        const questions = await prisma.question.findMany({
            where,
            include: {
                creator: {
                    select: { id: true, name: true },
                },
                _count: {
                    select: { submissions: true },
                },
            },
            orderBy: { createdAt: 'desc' },
        });

        return questions;
    }

    static async getQuestionById(questionId: string, userId: string) {
        const question = await prisma.question.findUnique({
            where: { id: questionId },
            include: {
                creator: {
                    select: { id: true, name: true, email: true },
                },
                _count: {
                    select: { interviews: true, submissions: true },
                },
            },
        });

        if (!question) {
            throw new NotFoundError('Question not found');
        }

        // Check access
        if (!question.isPublic && question.creatorId !== userId) {
            throw new ForbiddenError('You do not have access to this question');
        }

        return question;
    }

    static async updateQuestion(questionId: string, userId: string, input: UpdateQuestionInput) {
        const question = await prisma.question.findUnique({
            where: { id: questionId },
        });

        if (!question) {
            throw new NotFoundError('Question not found');
        }

        if (question.creatorId !== userId) {
            throw new ForbiddenError('Only the creator can update this question');
        }

        // Transform input to database-compatible format
        const data: any = { ...input };
        if (input.tags) data.tags = JSON.stringify(input.tags);
        if (input.starterCode) data.starterCode = JSON.stringify(input.starterCode);
        if (input.testCases) data.testCases = JSON.stringify(input.testCases);
        if (input.hints) data.hints = JSON.stringify(input.hints);

        const updated = await prisma.question.update({
            where: { id: questionId },
            data,
            include: {
                creator: {
                    select: { id: true, name: true, email: true },
                },
            },
        });

        return updated;
    }

    static async deleteQuestion(questionId: string, userId: string) {
        const question = await prisma.question.findUnique({
            where: { id: questionId },
        });

        if (!question) {
            throw new NotFoundError('Question not found');
        }

        if (question.creatorId !== userId) {
            throw new ForbiddenError('Only the creator can delete this question');
        }

        await prisma.question.delete({
            where: { id: questionId },
        });
    }

    static async getCategories() {
        const categories = await prisma.question.groupBy({
            by: ['category'],
            _count: true,
            orderBy: {
                _count: {
                    category: 'desc',
                },
            },
        });

        return categories.map((c) => ({
            name: c.category,
            count: c._count,
        }));
    }

    static async getTags() {
        const questions = await prisma.question.findMany({
            select: { tags: true },
        });

        const tagCounts: Record<string, number> = {};

        for (const q of questions) {
            for (const tag of q.tags) {
                tagCounts[tag] = (tagCounts[tag] || 0) + 1;
            }
        }

        return Object.entries(tagCounts)
            .map(([name, count]) => ({ name, count }))
            .sort((a, b) => b.count - a.count);
    }
}
