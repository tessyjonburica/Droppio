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
      const userRole = req.user!.role;

      logger.info(`Update overlay config attempt: streamer_id=${streamer_id}, wallet=${walletAddress}, role=${userRole}`);

      // Validate streamer_id matches authenticated user
      const user = await userModel.findByWalletAddress(walletAddress);
      if (!user) {
        logger.warn(`User not found for wallet: ${walletAddress}`);
        res.status(404).json({ error: 'User not found' });
        return;
      }

      if (user.id !== streamer_id) {
        logger.warn(`User ID mismatch: user.id=${user.id}, streamer_id=${streamer_id}`);
        res.status(403).json({
          error: 'Unauthorized: You can only update your own overlay settings',
          details: `User ID (${user.id}) does not match streamer ID (${streamer_id})`
        });
        return;
      }

      if (userRole !== 'creator') {
        logger.warn(`Insufficient role: user role=${userRole}, required=creator`);
        res.status(403).json({
          error: 'Insufficient permissions: Creator role required',
          details: `Your role is '${userRole}', but 'creator' is required`
        });
        return;
      }

      const overlay = await overlayService.updateConfig(streamer_id, req.body);
      logger.info(`Overlay config updated successfully for streamer: ${streamer_id}`);
      res.status(200).json({ overlay });
    } catch (error) {
      logger.error('Update overlay config error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Internal server error';
      res.status(400).json({ error: errorMessage });
    }
  },

  getOverlayToken: async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const { streamer_id } = req.params;
      const walletAddress = req.user!.walletAddress;
      const userRole = req.user!.role;

      logger.info(`Get overlay token request: streamer_id=${streamer_id}, wallet=${walletAddress}, role=${userRole}`);

      // Validate streamer_id matches authenticated user
      const user = await userModel.findByWalletAddress(walletAddress);
      if (!user) {
        logger.warn(`User not found for wallet: ${walletAddress}`);
        res.status(404).json({ error: 'User not found' });
        return;
      }

      if (user.id !== streamer_id) {
        logger.warn(`User ID mismatch: user.id=${user.id}, streamer_id=${streamer_id}`);
        res.status(403).json({
          error: 'Unauthorized: You can only get your own overlay token'
        });
        return;
      }

      if (userRole !== 'creator') {
        logger.warn(`Insufficient role: user role=${userRole}, required=creator`);
        res.status(403).json({
          error: 'Insufficient permissions: Creator role required'
        });
        return;
      }

      const token = await overlayService.getOrCreateOverlayToken(streamer_id);
      logger.info(`Overlay token retrieved successfully for streamer: ${streamer_id}`);

      res.status(200).json({ token });
    } catch (error) {
      logger.error('Get overlay token error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Internal server error';
      res.status(500).json({ error: errorMessage });
    }
  },
};
