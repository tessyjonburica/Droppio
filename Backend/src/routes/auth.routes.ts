import { Router } from 'express';
import { authController } from '../controllers/auth.controller';
import { validate } from '../middleware/validate.middleware';
import { authenticateToken } from '../middleware/auth.middleware';
import { LoginInputSchema, RefreshTokenInputSchema } from '../types/auth';
import { z } from 'zod';

const router = Router();

// POST /auth/login
// Body: { walletAddress, signature, message, role? }
router.post('/login', validate(z.object({ body: LoginInputSchema })), authController.login);

// POST /auth/refresh
// Body: { refreshToken }
router.post('/refresh', validate(z.object({ body: RefreshTokenInputSchema })), authController.refresh);

// POST /auth/logout
// Requires authentication
// Body: { refreshToken }
router.post('/logout', authenticateToken, authController.logout);

export default router;
