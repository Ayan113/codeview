import { Router } from 'express';
import { NoteController, createNoteSchema, updateNoteSchema, analyzeCodeSchema } from '../controllers/note.controller';
import { authenticate } from '../middleware/auth.middleware';
import { validate } from '../middleware/validation.middleware';

const router = Router();

// All routes require authentication
router.use(authenticate);

// Interview-scoped note routes
// These are mounted at /api/interviews/:id/notes in the main router
export const interviewNoteRoutes = Router({ mergeParams: true });
interviewNoteRoutes.use(authenticate);

interviewNoteRoutes.get('/', NoteController.getNotes);
interviewNoteRoutes.post('/', validate(createNoteSchema), NoteController.createNote);

// Individual note routes
// These are mounted at /api/notes
router.get('/:noteId', NoteController.getNoteById);
router.put('/:noteId', validate(updateNoteSchema), NoteController.updateNote);
router.delete('/:noteId', NoteController.deleteNote);

// AI routes
// These are mounted at /api/ai
export const aiRoutes = Router();
aiRoutes.use(authenticate);
aiRoutes.post('/analyze-code', validate(analyzeCodeSchema), NoteController.analyzeCode);

export default router;
