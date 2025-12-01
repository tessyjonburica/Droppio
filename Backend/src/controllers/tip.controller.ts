import { Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth.middleware';
import { tipService } from '../services/tip.service';
import { logger } from '../utils/logger';

export const tipController = {
  sendTip: async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const walletAddress = req.user!.walletAddress;
      const tip = await tipService.sendTip(walletAddress, req.body);
      res.status(201).json({ tip });
    } catch (error) {
      logger.error('Send tip error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Internal server error';
      res.status(400).json({ error: errorMessage });
    }
  },
};
