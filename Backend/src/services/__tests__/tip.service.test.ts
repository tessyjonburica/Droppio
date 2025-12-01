import { tipService } from '../tip.service';
import { tipModel } from '../../models/tip.model';
import { streamModel } from '../../models/stream.model';
import { userModel } from '../../models/user.model';
import { verifyWalletSignature } from '../../utils/signature';
import { verifyUSDCTransaction } from '../../utils/blockchain';

jest.mock('../../models/tip.model');
jest.mock('../../models/stream.model');
jest.mock('../../models/user.model');
jest.mock('../../utils/signature');
jest.mock('../../utils/blockchain');
jest.mock('../../websockets/streamer.ws', () => ({
  streamerWsHelpers: {
    notifyTipReceived: jest.fn(),
  },
}));
jest.mock('../../websockets/overlay.ws', () => ({
  overlayWsHelpers: {
    notifyTipEvent: jest.fn(),
  },
}));

describe('Tip Service', () => {
  const mockWalletAddress = '0x1234567890123456789012345678901234567890';
  const mockViewer = {
    id: 'viewer-123',
    wallet_address: mockWalletAddress,
    role: 'viewer' as const,
    display_name: 'Test Viewer',
    avatar_url: null,
    platform: null,
    payout_wallet: null,
    created_at: new Date(),
    updated_at: new Date(),
  };

  const mockStream = {
    id: 'stream-123',
    streamer_id: 'streamer-123',
    platform: 'twitch' as const,
    stream_key: 'stream-key',
    is_live: true,
    created_at: new Date(),
    ended_at: null,
  };

  const mockTip = {
    id: 'tip-123',
    stream_id: mockStream.id,
    viewer_id: mockViewer.id,
    amount_usdc: '10.5',
    tx_hash: '0xabc123',
    created_at: new Date(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('sendTip', () => {
    it('should send tip successfully', async () => {
      (verifyWalletSignature as jest.Mock).mockResolvedValue({
        isValid: true,
        address: mockWalletAddress,
      });
      (streamModel.findById as jest.Mock).mockResolvedValue(mockStream);
      (userModel.findByWalletAddress as jest.Mock).mockResolvedValue(mockViewer);
      (verifyUSDCTransaction as jest.Mock).mockResolvedValue(true);
      (tipModel.create as jest.Mock).mockResolvedValue(mockTip);

      const result = await tipService.sendTip(mockWalletAddress, {
        streamId: mockStream.id,
        amountUsdc: '10.5',
        signature: 'signature',
        message: 'message',
        txHash: '0xabc123',
      });

      expect(result).toHaveProperty('id');
      expect(verifyUSDCTransaction).toHaveBeenCalled();
      expect(tipModel.create).toHaveBeenCalled();
    });

    it('should throw error on invalid signature', async () => {
      (verifyWalletSignature as jest.Mock).mockResolvedValue({
        isValid: false,
        address: null,
      });

      await expect(
        tipService.sendTip(mockWalletAddress, {
          streamId: mockStream.id,
          amountUsdc: '10.5',
          signature: 'invalid',
          message: 'message',
          txHash: '0xabc123',
        })
      ).rejects.toThrow('Invalid wallet signature');
    });

    it('should throw error if stream is not live', async () => {
      (verifyWalletSignature as jest.Mock).mockResolvedValue({
        isValid: true,
        address: mockWalletAddress,
      });
      (streamModel.findById as jest.Mock).mockResolvedValue({
        ...mockStream,
        is_live: false,
      });

      await expect(
        tipService.sendTip(mockWalletAddress, {
          streamId: mockStream.id,
          amountUsdc: '10.5',
          signature: 'signature',
          message: 'message',
          txHash: '0xabc123',
        })
      ).rejects.toThrow('Stream is not live');
    });
  });
});

