import { Router } from 'express';
import {
    ExecutionController,
    executeCodeSchema,
    runTestsSchema,
} from '../controllers/execution.controller';
import { authenticate } from '../middleware/auth.middleware';
import { validate } from '../middleware/validation.middleware';
import { executionLimiter } from '../middleware/rateLimit.middleware';

const router = Router();

// All routes require authentication
router.use(authenticate);

// Code execution (rate limited)
router.post('/run', executionLimiter, validate(executeCodeSchema), ExecutionController.executeCode);

// Run test cases
router.post('/test', executionLimiter, validate(runTestsSchema), ExecutionController.runTests);

// Get submissions for an interview
router.get('/submissions/:interviewId', ExecutionController.getSubmissions);

export default router;
