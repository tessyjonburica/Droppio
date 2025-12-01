import { overlayService } from '../overlay.service';
import { overlayModel } from '../../models/overlay.model';
import { userModel } from '../../models/user.model';

jest.mock('../../models/overlay.model');
jest.mock('../../models/user.model');

describe('Overlay Service', () => {
  const mockStreamerId = 'streamer-123';
  const mockStreamer = {
    id: mockStreamerId,
    wallet_address: '0x1234567890123456789012345678901234567890',
    role: 'streamer' as const,
    display_name: 'Test Streamer',
    avatar_url: null,
    platform: 'twitch' as const,
    payout_wallet: null,
    created_at: new Date(),
    updated_at: new Date(),
  };

  const mockOverlay = {
    id: 'overlay-123',
    streamer_id: mockStreamerId,
    theme: {
      primaryColor: '#000000',
    },
    alert_settings: {
      enabled: true,
      soundEnabled: false,
      minAmount: '0',
      showDuration: 5000,
    },
    created_at: new Date(),
    updated_at: new Date(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getConfig', () => {
    it('should get existing overlay config', async () => {
      (overlayModel.findByStreamerId as jest.Mock).mockResolvedValue(mockOverlay);

      const result = await overlayService.getConfig(mockStreamerId);

      expect(result).toEqual(mockOverlay);
    });

    it('should create default overlay if not exists', async () => {
      (overlayModel.findByStreamerId as jest.Mock).mockResolvedValue(null);
      (userModel.findById as jest.Mock).mockResolvedValue(mockStreamer);
      (overlayModel.create as jest.Mock).mockResolvedValue(mockOverlay);

      const result = await overlayService.getConfig(mockStreamerId);

      expect(overlayModel.create).toHaveBeenCalled();
      expect(result).toEqual(mockOverlay);
    });
  });

  describe('updateConfig', () => {
    it('should update overlay config successfully', async () => {
      (userModel.findById as jest.Mock).mockResolvedValue(mockStreamer);
      (overlayModel.findByStreamerId as jest.Mock).mockResolvedValue(mockOverlay);
      const updatedOverlay = {
        ...mockOverlay,
        theme: { primaryColor: '#FF0000' },
      };
      (overlayModel.update as jest.Mock).mockResolvedValue(updatedOverlay);

      const result = await overlayService.updateConfig(mockStreamerId, {
        theme: { primaryColor: '#FF0000' },
      });

      expect(result).toEqual(updatedOverlay);
      expect(overlayModel.update).toHaveBeenCalled();
    });
  });
});

