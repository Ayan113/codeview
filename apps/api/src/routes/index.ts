import { Router } from 'express';
import authRoutes from './auth.routes';
import interviewRoutes from './interview.routes';
import questionRoutes from './question.routes';
import executionRoutes from './execution.routes';
import noteRoutes, { aiRoutes } from './note.routes';

const router = Router();

// API routes
router.use('/auth', authRoutes);
router.use('/interviews', interviewRoutes);
router.use('/questions', questionRoutes);
router.use('/execute', executionRoutes);
router.use('/notes', noteRoutes);
router.use('/ai', aiRoutes);

// Health check
router.get('/health', (_req, res) => {
    res.json({
        success: true,
        data: {
            status: 'healthy',
            timestamp: new Date().toISOString(),
            uptime: process.uptime(),
            environment: process.env.NODE_ENV || 'development',
            version: '2.0.0', // Added version for production
        },
    });
});

export default router;
