import { Router } from 'express';
import { authenticateToken } from '../middleware/auth.middleware';
import { requireRole } from '../middleware/auth.middleware';
import { overlayController } from '../controllers/overlay.controller';
import { validate } from '../middleware/validate.middleware';
import { z } from 'zod';

const router = Router();

// GET /overlay/:streamer_id/config
// Requires authentication
const getOverlaySchema = z.object({
  params: z.object({
    streamer_id: z.string().uuid('Invalid streamer ID'),
  }),
});
router.get('/:streamer_id/config', authenticateToken, validate(getOverlaySchema), overlayController.getConfig);

// PATCH /overlay/:streamer_id/config
// Requires authentication + streamer role (and ownership)
// Body: { theme?, alertSettings? }
const updateOverlaySchema = z.object({
  params: z.object({
    streamer_id: z.string().uuid('Invalid streamer ID'),
  }),
  body: z.object({
    theme: z
      .object({
        primaryColor: z.string().optional(),
        secondaryColor: z.string().optional(),
        fontFamily: z.string().optional(),
        fontSize: z.number().optional(),
        animationStyle: z.string().optional(),
      })
      .optional(),
    alertSettings: z
      .object({
        enabled: z.boolean().optional(),
        soundEnabled: z.boolean().optional(),
        minAmount: z.string().optional(),
        showDuration: z.number().optional(),
      })
      .optional(),
  }),
});
router.patch(
  '/:streamer_id/config',
  authenticateToken,
  requireRole(['creator']),
  validate(updateOverlaySchema),
  overlayController.updateConfig
);

export default router;
