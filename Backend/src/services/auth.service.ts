import { LoginInput, RefreshTokenInput, AuthResponse } from '../types/auth';
import { userModel } from '../models/user.model';
import { verifyWalletSignature } from '../utils/signature';
import {
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
  verifyAccessToken,
  JwtPayload,
} from '../utils/jwt';
import { redis } from '../config/redis';
import { env } from '../config/env';
import { logger } from '../utils/logger';

export const authService = {
  login: async (input: LoginInput): Promise<AuthResponse> => {
    // Verify wallet signature
    const verification = await verifyWalletSignature(
      input.message,
      input.signature,
      input.walletAddress
    );

    if (!verification.isValid || !verification.address) {
      throw new Error('Invalid wallet signature');
    }

    // Find or create user
    let user = await userModel.findByWalletAddress(input.walletAddress);

    if (!user) {
      // Create new user if doesn't exist
      user = await userModel.create({
        walletAddress: input.walletAddress,
        role: input.role || 'viewer',
      });
    } else if (input.role && user.role !== input.role) {
      // Update role if provided and different
      user = await userModel.onboard({
        walletAddress: input.walletAddress,
        role: input.role,
      });
    }

    if (!user) {
      throw new Error('Failed to create or find user');
    }

    // Generate tokens
    const payload: JwtPayload = {
      walletAddress: user.wallet_address,
      role: user.role,
    };

    const accessToken = generateAccessToken(payload);
    const refreshToken = generateRefreshToken(payload);

    // Store refresh token in Redis with rotation
    const refreshTokenKey = `refresh_token:${user.id}:${refreshToken}`;
    await redis.setex(refreshTokenKey, 7 * 24 * 60 * 60, '1'); // 7 days TTL

    return {
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        walletAddress: user.wallet_address,
        role: user.role,
        displayName: user.display_name,
        avatarUrl: user.avatar_url,
      },
    };
  },

  refresh: async (input: RefreshTokenInput): Promise<{ accessToken: string; refreshToken: string }> => {
    // Verify refresh token
    let payload: JwtPayload;
    try {
      payload = verifyRefreshToken(input.refreshToken);
    } catch (error) {
      throw new Error('Invalid or expired refresh token');
    }

    // Find user to get ID
    const user = await userModel.findByWalletAddress(payload.walletAddress);
    if (!user) {
      throw new Error('User not found');
    }

    // Check if token exists in Redis (not blacklisted)
    const refreshTokenKey = `refresh_token:${user.id}:${input.refreshToken}`;
    const exists = await redis.get(refreshTokenKey);

    if (!exists) {
      throw new Error('Refresh token has been revoked');
    }

    // Rotate refresh token (revoke old, create new)
    await redis.del(refreshTokenKey);

    // Generate new tokens
    const newPayload: JwtPayload = {
      walletAddress: user.wallet_address,
      role: user.role,
    };

    const newAccessToken = generateAccessToken(newPayload);
    const newRefreshToken = generateRefreshToken(newPayload);

    // Store new refresh token in Redis
    const newRefreshTokenKey = `refresh_token:${user.id}:${newRefreshToken}`;
    await redis.setex(newRefreshTokenKey, 7 * 24 * 60 * 60, '1'); // 7 days TTL

    return {
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
    };
  },

  logout: async (accessToken: string, refreshToken: string): Promise<void> => {
    try {
      // Verify access token to get user info
      let payload: JwtPayload;
      try {
        payload = verifyAccessToken(accessToken);
      } catch {
        // Token might be expired, try to decode without verification for blacklisting
        payload = { walletAddress: '', role: 'viewer' };
      }

      // Blacklist access token (use remaining TTL from JWT)
      const accessTokenKey = `blacklist:${accessToken}`;
      // Access token expires in 15 minutes
      await redis.setex(accessTokenKey, 15 * 60, '1');

      // Blacklist refresh token
      if (refreshToken) {
        const refreshTokenKey = `blacklist:${refreshToken}`;
        // Refresh token expires in 7 days
        await redis.setex(refreshTokenKey, 7 * 24 * 60 * 60, '1');

        // Also remove refresh token from valid tokens
        if (payload.walletAddress) {
          const user = await userModel.findByWalletAddress(payload.walletAddress);
          if (user) {
            const refreshTokenStoreKey = `refresh_token:${user.id}:${refreshToken}`;
            await redis.del(refreshTokenStoreKey);
          }
        }
      }
    } catch (error) {
      // Log but don't throw - logout should still succeed
      logger.error('Logout error (non-critical):', error);
    }
  },
};
