import { Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth.middleware';
import { userService } from '../services/user.service';
import { logger } from '../utils/logger';

export const userController = {
  onboard: async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const walletAddress = req.user!.walletAddress;
      const input = { walletAddress, ...req.body };
      const user = await userService.onboard(walletAddress, input);
      res.status(200).json({ user });
    } catch (error) {
      logger.error('Onboard error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Internal server error';
      res.status(400).json({ error: errorMessage });
    }
  },

  getProfile: async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const walletAddress = req.user!.walletAddress;
      const user = await userService.getProfile(walletAddress);
      res.status(200).json({ user });
    } catch (error) {
      logger.error('Get profile error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Internal server error';
      res.status(404).json({ error: errorMessage });
    }
  },

  updateProfile: async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const walletAddress = req.user!.walletAddress;
      const user = await userService.updateStreamerProfile(walletAddress, req.body);
      res.status(200).json({ user });
    } catch (error) {
      logger.error('Update profile error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Internal server error';
      res.status(400).json({ error: errorMessage });
    }
  },
};
