import { Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth.middleware';
import { creatorService } from '../services/creator.service';
import { logger } from '../utils/logger';

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
};
