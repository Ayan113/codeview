import { Request, Response, NextFunction } from 'express';
import { NoteService } from '../services/note.service';
import { AIService } from '../services/ai.service';
import { z } from 'zod';

// Validation schemas
export const createNoteSchema = z.object({
    content: z.string().min(1, 'Content is required').max(10000),
    isPrivate: z.boolean().optional(),
});

export const updateNoteSchema = z.object({
    content: z.string().min(1, 'Content is required').max(10000),
    isPrivate: z.boolean().optional(),
});

export const analyzeCodeSchema = z.object({
    code: z.string().min(1, 'Code is required').max(50000),
    language: z.enum(['javascript', 'python', 'typescript', 'java', 'cpp']),
});

export class NoteController {
    /**
     * Create a new note for an interview
     */
    static async createNote(req: Request, res: Response, next: NextFunction) {
        try {
            const note = await NoteService.createNote(
                req.params.id,
                req.user!.id,
                req.body
            );

            res.status(201).json({
                success: true,
                data: note,
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * Get all notes for an interview
     */
    static async getNotes(req: Request, res: Response, next: NextFunction) {
        try {
            const notes = await NoteService.getNotes(req.params.id, req.user!.id);

            res.json({
                success: true,
                data: notes,
                count: notes.length,
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * Get a single note by ID
     */
    static async getNoteById(req: Request, res: Response, next: NextFunction) {
        try {
            const note = await NoteService.getNoteById(req.params.noteId, req.user!.id);

            res.json({
                success: true,
                data: note,
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * Update a note
     */
    static async updateNote(req: Request, res: Response, next: NextFunction) {
        try {
            const note = await NoteService.updateNote(
                req.params.noteId,
                req.user!.id,
                req.body
            );

            res.json({
                success: true,
                data: note,
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * Delete a note
     */
    static async deleteNote(req: Request, res: Response, next: NextFunction) {
        try {
            await NoteService.deleteNote(req.params.noteId, req.user!.id);

            res.json({
                success: true,
                message: 'Note deleted successfully',
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * Get interview summary
     */
    static async getInterviewSummary(req: Request, res: Response, next: NextFunction) {
        try {
            const summary = await NoteService.getInterviewSummary(req.params.id, req.user!.id);

            res.json({
                success: true,
                data: summary,
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * Analyze code quality with AI
     */
    static async analyzeCode(req: Request, res: Response, next: NextFunction) {
        try {
            const { code, language } = req.body;
            const analysis = await AIService.analyzeCode(code, language);

            res.json({
                success: true,
                data: analysis,
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * Generate AI feedback for an interview
     */
    static async generateAIFeedback(req: Request, res: Response, next: NextFunction) {
        try {
            const feedback = await AIService.generateInterviewFeedback(req.params.id, req.user!.id);

            res.json({
                success: true,
                data: feedback,
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * Generate AI summary and save as a note
     */
    static async generateAISummary(req: Request, res: Response, next: NextFunction) {
        try {
            const result = await AIService.saveAIFeedbackAsNote(req.params.id, req.user!.id);

            res.status(201).json({
                success: true,
                data: result,
                message: 'AI summary generated and saved as a note',
            });
        } catch (error) {
            next(error);
        }
    }
}
