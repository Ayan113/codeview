import { Router } from 'express';
import {
    AuthController,
    registerSchema,
    loginSchema,
    updateProfileSchema,
    changePasswordSchema,
} from '../controllers/auth.controller';
import { authenticate } from '../middleware/auth.middleware';
import { validate } from '../middleware/validation.middleware';
import { authLimiter } from '../middleware/rateLimit.middleware';

const router = Router();

// Public routes
router.post('/register', authLimiter, validate(registerSchema), AuthController.register);
router.post('/login', authLimiter, validate(loginSchema), AuthController.login);

// Protected routes
router.get('/me', authenticate, AuthController.getProfile);
router.put('/profile', authenticate, validate(updateProfileSchema), AuthController.updateProfile);
router.post('/change-password', authenticate, validate(changePasswordSchema), AuthController.changePassword);
router.post('/logout', authenticate, AuthController.logout);

export default router;
