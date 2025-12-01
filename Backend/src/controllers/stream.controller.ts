import { Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth.middleware';
import { streamService } from '../services/stream.service';
import { logger } from '../utils/logger';
import { userModel } from '../models/user.model';

export const streamController = {
  startStream: async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const walletAddress = req.user!.walletAddress;
      const user = await userModel.findByWalletAddress(walletAddress);
      if (!user) {
        res.status(404).json({ error: 'User not found' });
        return;
      }

      const stream = await streamService.startStream(user.id, req.body);
      res.status(201).json({ stream });
    } catch (error) {
      logger.error('Start stream error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Internal server error';
      res.status(400).json({ error: errorMessage });
    }
  },

  endStream: async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const walletAddress = req.user!.walletAddress;
      const user = await userModel.findByWalletAddress(walletAddress);
      if (!user) {
        res.status(404).json({ error: 'User not found' });
        return;
      }

      const { streamId } = req.body;
      const stream = await streamService.endStream(streamId, user.id);
      res.status(200).json({ stream });
    } catch (error) {
      logger.error('End stream error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Internal server error';
      res.status(400).json({ error: errorMessage });
    }
  },

  getStream: async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const stream = await streamService.getStream(id);
      res.status(200).json({ stream });
    } catch (error) {
      logger.error('Get stream error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Internal server error';
      res.status(404).json({ error: errorMessage });
    }
  },

  getActiveStream: async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const { streamer_id } = req.params;
      const stream = await streamService.getActiveStream(streamer_id);
      if (!stream) {
        res.status(404).json({ error: 'No active stream found' });
        return;
      }
      res.status(200).json({ stream });
    } catch (error) {
      logger.error('Get active stream error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Internal server error';
      res.status(404).json({ error: errorMessage });
    }
  },
};
