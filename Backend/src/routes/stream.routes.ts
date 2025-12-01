import { Router } from 'express';
import { authenticateToken } from '../middleware/auth.middleware';
import { requireRole } from '../middleware/auth.middleware';
import { streamController } from '../controllers/stream.controller';
import { validate } from '../middleware/validate.middleware';
import { z } from 'zod';
import { PlatformSchema } from '../types/user';

const router = Router();

// POST /streams/start
// Requires authentication + streamer role
// Body: { platform, streamKey }
const startStreamSchema = z.object({
  body: z.object({
    platform: PlatformSchema,
    streamKey: z.string().min(1, 'Stream key required'),
  }),
});
router.post(
  '/start',
  authenticateToken,
  requireRole(['streamer']),
  validate(startStreamSchema),
  streamController.startStream
);

// POST /streams/end
// Requires authentication + streamer role
// Body: { streamId }
const endStreamSchema = z.object({
  body: z.object({
    streamId: z.string().uuid('Invalid stream ID'),
  }),
});
router.post(
  '/end',
  authenticateToken,
  requireRole(['streamer']),
  validate(endStreamSchema),
  streamController.endStream
);

// GET /streams/:id
// Public endpoint (or authenticated)
const getStreamSchema = z.object({
  params: z.object({
    id: z.string().uuid('Invalid stream ID'),
  }),
});
router.get('/:id', validate(getStreamSchema), streamController.getStream);

// GET /streams/active/:streamer_id
// Public endpoint
const getActiveStreamSchema = z.object({
  params: z.object({
    streamer_id: z.string().uuid('Invalid streamer ID'),
  }),
});
router.get('/active/:streamer_id', validate(getActiveStreamSchema), streamController.getActiveStream);

export default router;
