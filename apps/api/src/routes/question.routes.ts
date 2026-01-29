import { Router } from 'express';
import {
    QuestionController,
    createQuestionSchema,
    updateQuestionSchema,
} from '../controllers/question.controller';
import { authenticate } from '../middleware/auth.middleware';
import { validate } from '../middleware/validation.middleware';

const router = Router();

// All routes require authentication
router.use(authenticate);

// Metadata routes
router.get('/categories', QuestionController.getCategories);
router.get('/tags', QuestionController.getTags);

// CRUD operations
router.post('/', validate(createQuestionSchema), QuestionController.createQuestion);
router.get('/', QuestionController.getQuestions);
router.get('/:id', QuestionController.getQuestionById);
router.put('/:id', validate(updateQuestionSchema), QuestionController.updateQuestion);
router.delete('/:id', QuestionController.deleteQuestion);

export default router;
