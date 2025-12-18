import { Router } from 'express';
import { authenticateToken } from '../middleware/auth.middleware';
import { requireRole } from '../middleware/auth.middleware';
import { tipController } from '../controllers/tip.controller';
import { validate } from '../middleware/validate.middleware';
import { z } from 'zod';

const router = Router();

// POST /tips/send
// Requires authentication + viewer role
// Body: { streamId?, creatorId?, amountUsdc, signature, message, txHash }
// Either streamId OR creatorId must be provided (not both)
const sendTipSchema = z.object({
  body: z.object({
    streamId: z.string().uuid('Invalid stream ID').optional(),
    creatorId: z.string().uuid('Invalid creator ID').optional(),
    amountUsdc: z.string().regex(/^\d+(\.\d{1,6})?$/, 'Invalid USDC amount'),
    signature: z.string().min(1, 'Signature required'),
    message: z.string().min(1, 'Message required'),
    txHash: z.string().regex(/^0x[a-fA-F0-9]{64}$/, 'Invalid transaction hash'),
  }).refine(
    (data) => (data.streamId && !data.creatorId) || (!data.streamId && data.creatorId),
    {
      message: 'Either streamId or creatorId must be provided (not both)',
    }
  ),
});
router.post(
  '/send',
  authenticateToken,
  requireRole(['viewer']),
  validate(sendTipSchema),
  tipController.sendTip
);

export default router;
