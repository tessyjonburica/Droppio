import { Router } from 'express';
import { authenticateToken } from '../middleware/auth.middleware';
import { userController } from '../controllers/user.controller';
import { validate } from '../middleware/validate.middleware';
import { z } from 'zod';
import { UserRoleSchema, PlatformSchema } from '../types/user';

const router = Router();

// POST /users/onboard
// Requires authentication
// Body: { role, displayName, avatarUrl?, platform?, payoutWallet? }
const onboardSchema = z.object({
  body: z.object({
    role: UserRoleSchema,
    displayName: z.string().min(1).max(100),
    avatarUrl: z.string().url().optional(),
    platform: PlatformSchema.optional(),
    payoutWallet: z.string().regex(/^0x[a-fA-F0-9]{40}$/).optional(),
  }),
});
router.post('/onboard', authenticateToken, validate(onboardSchema), userController.onboard);

// GET /users/me
// Requires authentication
router.get('/me', authenticateToken, userController.getProfile);

// PATCH /users/me
// Requires authentication
// Body: { displayName?, avatarUrl?, bio?, platform?, payoutWallet? }
const updateProfileSchema = z.object({
  body: z.object({
    displayName: z.string().min(1).max(100).optional(),
    avatarUrl: z.string().url().optional(),
    bio: z.string().max(500).optional(),
    platform: PlatformSchema.optional(),
    payoutWallet: z.string().regex(/^0x[a-fA-F0-9]{40}$/).optional(),
  }),
});
router.patch('/me', authenticateToken, validate(updateProfileSchema), userController.updateProfile);

export default router;
