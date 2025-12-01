import { Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth.middleware';
import { authService } from '../services/auth.service';
import { LoginInput } from '../types/auth';
import { logger } from '../utils/logger';

export const authController = {
  login: async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const input: LoginInput = req.body;
      const result = await authService.login(input);
      res.status(200).json(result);
    } catch (error) {
      logger.error('Login error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Internal server error';
      res.status(400).json({ error: errorMessage });
    }
  },

  refresh: async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const { refreshToken } = req.body;
      const result = await authService.refresh({ refreshToken });
      res.status(200).json(result);
    } catch (error) {
      logger.error('Refresh token error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Invalid refresh token';
      res.status(401).json({ error: errorMessage });
    }
  },

  logout: async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const { refreshToken } = req.body;
      const authHeader = req.headers.authorization;
      const accessToken = authHeader && authHeader.split(' ')[1];

      if (accessToken && refreshToken) {
        await authService.logout(accessToken, refreshToken);
      }

      res.status(200).json({ message: 'Logged out successfully' });
    } catch (error) {
      logger.error('Logout error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  },
};
