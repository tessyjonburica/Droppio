import { Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth.middleware';
import { overlayService } from '../services/overlay.service';
import { logger } from '../utils/logger';
import { userModel } from '../models/user.model';

export const overlayController = {
  getConfig: async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const { streamer_id } = req.params;
      const overlay = await overlayService.getConfig(streamer_id);
      res.status(200).json({ overlay });
    } catch (error) {
      logger.error('Get overlay config error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Internal server error';
      res.status(404).json({ error: errorMessage });
    }
  },

  updateConfig: async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const { streamer_id } = req.params;
      const walletAddress = req.user!.walletAddress;
      
      // Validate streamer_id matches authenticated user
      const user = await userModel.findByWalletAddress(walletAddress);
      if (!user) {
        res.status(404).json({ error: 'User not found' });
        return;
      }

      if (user.id !== streamer_id) {
        res.status(403).json({ error: 'Unauthorized' });
        return;
      }

      const overlay = await overlayService.updateConfig(streamer_id, req.body);
      res.status(200).json({ overlay });
    } catch (error) {
      logger.error('Update overlay config error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Internal server error';
      res.status(400).json({ error: errorMessage });
    }
  },
};
