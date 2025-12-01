import { authService } from '../auth.service';
import { userModel } from '../../models/user.model';
import { redis } from '../../config/redis';
import { verifyWalletSignature } from '../../utils/signature';
import { generateAccessToken, generateRefreshToken, verifyRefreshToken } from '../../utils/jwt';

jest.mock('../../models/user.model');
jest.mock('../../config/redis');
jest.mock('../../utils/signature');
jest.mock('../../utils/jwt');

describe('Auth Service', () => {
  const mockWalletAddress = '0x1234567890123456789012345678901234567890';
  const mockUser = {
    id: 'user-123',
    wallet_address: mockWalletAddress,
    role: 'viewer' as const,
    display_name: null,
    avatar_url: null,
    platform: null,
    payout_wallet: null,
    created_at: new Date(),
    updated_at: new Date(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('login', () => {
    it('should login existing user successfully', async () => {
      (verifyWalletSignature as jest.Mock).mockResolvedValue({
        isValid: true,
        address: mockWalletAddress,
      });
      (userModel.findByWalletAddress as jest.Mock).mockResolvedValue(mockUser);
      (generateAccessToken as jest.Mock).mockReturnValue('access-token');
      (generateRefreshToken as jest.Mock).mockReturnValue('refresh-token');
      (redis.setex as jest.Mock).mockResolvedValue('OK');

      const result = await authService.login({
        walletAddress: mockWalletAddress,
        signature: 'signature',
        message: 'message',
      });

      expect(result).toHaveProperty('accessToken');
      expect(result).toHaveProperty('refreshToken');
      expect(result).toHaveProperty('user');
      expect(redis.setex).toHaveBeenCalled();
    });

    it('should create new user if not exists', async () => {
      (verifyWalletSignature as jest.Mock).mockResolvedValue({
        isValid: true,
        address: mockWalletAddress,
      });
      (userModel.findByWalletAddress as jest.Mock).mockResolvedValue(null);
      (userModel.create as jest.Mock).mockResolvedValue(mockUser);
      (generateAccessToken as jest.Mock).mockReturnValue('access-token');
      (generateRefreshToken as jest.Mock).mockReturnValue('refresh-token');
      (redis.setex as jest.Mock).mockResolvedValue('OK');

      const result = await authService.login({
        walletAddress: mockWalletAddress,
        signature: 'signature',
        message: 'message',
        role: 'viewer',
      });

      expect(userModel.create).toHaveBeenCalled();
      expect(result).toHaveProperty('accessToken');
    });

    it('should throw error on invalid signature', async () => {
      (verifyWalletSignature as jest.Mock).mockResolvedValue({
        isValid: false,
        address: null,
      });

      await expect(
        authService.login({
          walletAddress: mockWalletAddress,
          signature: 'invalid',
          message: 'message',
        })
      ).rejects.toThrow('Invalid wallet signature');
    });
  });

  describe('refresh', () => {
    it('should refresh tokens successfully', async () => {
      const mockPayload = {
        walletAddress: mockWalletAddress,
        role: 'viewer' as const,
      };
      (verifyRefreshToken as jest.Mock).mockReturnValue(mockPayload);
      (userModel.findByWalletAddress as jest.Mock).mockResolvedValue(mockUser);
      (redis.get as jest.Mock).mockResolvedValue('1');
      (redis.del as jest.Mock).mockResolvedValue(1);
      (generateAccessToken as jest.Mock).mockReturnValue('new-access-token');
      (generateRefreshToken as jest.Mock).mockReturnValue('new-refresh-token');
      (redis.setex as jest.Mock).mockResolvedValue('OK');

      const result = await authService.refresh({ refreshToken: 'refresh-token' });

      expect(result).toHaveProperty('accessToken');
      expect(result).toHaveProperty('refreshToken');
      expect(redis.del).toHaveBeenCalled(); // Token rotation
    });

    it('should throw error on invalid refresh token', async () => {
      (verifyRefreshToken as jest.Mock).mockImplementation(() => {
        throw new Error('Invalid token');
      });

      await expect(authService.refresh({ refreshToken: 'invalid' })).rejects.toThrow(
        'Invalid or expired refresh token'
      );
    });
  });
});

