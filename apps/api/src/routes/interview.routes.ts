import { Router } from 'express';
import {
    InterviewController,
    createInterviewSchema,
    updateInterviewSchema,
    addQuestionSchema,
} from '../controllers/interview.controller';
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

export default router;
