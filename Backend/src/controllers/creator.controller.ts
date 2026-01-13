import { Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth.middleware';
import { creatorService } from '../services/creator.service';
import { blockchainListener } from '../services/blockchain-listener.service';
import { userModel } from '../models/user.model';
import { logger } from '../utils/logger';
import { env } from '../config/env';

export const creatorController = {
  getByUsername: async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const { username } = req.params;
      const creator = await creatorService.getByUsername(username);
      res.status(200).json({ creator });
    } catch (error) {
      logger.error('Get creator by username error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Creator not found';
      res.status(404).json({ error: errorMessage });
    }
  },

  searchCreators: async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const query = req.query.q as string;
      if (!query || query.trim().length === 0) {
        res.status(400).json({ error: 'Search query is required' });
        return;
      }

      const creators = await creatorService.searchCreators(query.trim());
      res.status(200).json({ creators });
    } catch (error) {
      logger.error('Search creators error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Internal server error';
      res.status(500).json({ error: errorMessage });
    }
  },

  getFeaturedCreators: async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const limit = parseInt(req.query.limit as string) || 10;
      const creators = await creatorService.getFeaturedCreators(limit);
      res.status(200).json({ creators });
    } catch (error) {
      logger.error('Get featured creators error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Internal server error';
      res.status(500).json({ error: errorMessage });
    }
  },

  getTotalTips: async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const { creatorId } = req.params;
      const result = await creatorService.getTotalTips(creatorId);
      res.status(200).json(result);
    } catch (error) {
      logger.error('Get total tips error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Internal server error';
      res.status(500).json({ error: errorMessage });
    }
  },

  getTipsByCreator: async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const { creatorId } = req.params;
      
      if (!creatorId) {
        res.status(400).json({ error: 'Creator ID is required' });
        return;
      }

      logger.debug(`Fetching tips for creator: ${creatorId}`);
      const tips = await creatorService.getTipsByCreator(creatorId);
      logger.debug(`Successfully fetched ${tips.length} tips for creator: ${creatorId}`);
      res.status(200).json({ tips });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Internal server error';
      const errorStack = error instanceof Error ? error.stack : undefined;
      logger.error(`Get tips by creator error for creatorId ${req.params.creatorId}:`, {
        message: errorMessage,
        stack: errorStack,
        error,
      });
      res.status(500).json({ 
        error: 'Failed to fetch tips',
        message: env.NODE_ENV === 'development' ? errorMessage : undefined,
      });
    }
  },

  syncTipsFromBlockchain: async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const { creatorId } = req.params;
      
      if (!creatorId) {
        res.status(400).json({ error: 'Creator ID is required' });
        return;
      }

      // Get creator's wallet address
      const creator = await userModel.findById(creatorId);
      if (!creator) {
        res.status(404).json({ error: 'Creator not found' });
        return;
      }

      logger.info(`Manual sync requested for creator ${creatorId} (wallet: ${creator.wallet_address})`);

      // Sync tips from blockchain (last 1000 blocks)
      const result = await blockchainListener.syncTips(creator.wallet_address);

      res.status(200).json({
        message: 'Sync completed',
        synced: result.synced,
        errors: result.errors,
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Internal server error';
      logger.error(`Sync tips error for creatorId ${req.params.creatorId}:`, error);
      res.status(500).json({ 
        error: 'Failed to sync tips',
        message: env.NODE_ENV === 'development' ? errorMessage : undefined,
      });
    }
  },
};
