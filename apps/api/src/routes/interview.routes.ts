import { Router } from 'express';
import {
    InterviewController,
    createInterviewSchema,
    updateInterviewSchema,
    addQuestionSchema,
} from '../controllers/interview.controller';
import { NoteController, createNoteSchema, updateNoteSchema } from '../controllers/note.controller';
import { authenticate } from '../middleware/auth.middleware';
import { validate } from '../middleware/validation.middleware';

const router = Router();

// All routes require authentication
router.use(authenticate);

// CRUD operations
router.post('/', validate(createInterviewSchema), InterviewController.createInterview);
router.get('/', InterviewController.getInterviews);
router.get('/room/:roomCode', InterviewController.getInterviewByRoomCode);
router.get('/:id', InterviewController.getInterviewById);
router.put('/:id', validate(updateInterviewSchema), InterviewController.updateInterview);
router.delete('/:id', InterviewController.deleteInterview);

// Interview lifecycle
router.post('/:id/start', InterviewController.startInterview);
router.post('/:id/end', InterviewController.endInterview);
router.post('/:id/join', InterviewController.joinInterview);

// Question management
router.post('/:id/questions', validate(addQuestionSchema), InterviewController.addQuestion);

// Notes management
router.get('/:id/notes', NoteController.getNotes);
router.post('/:id/notes', validate(createNoteSchema), NoteController.createNote);

// Interview summary and AI
router.get('/:id/summary', NoteController.getInterviewSummary);
router.get('/:id/ai-feedback', NoteController.generateAIFeedback);
router.post('/:id/ai-summary', NoteController.generateAISummary);

export default router;
