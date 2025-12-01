import { streamService } from '../stream.service';
import { streamModel } from '../../models/stream.model';
import { userModel } from '../../models/user.model';

jest.mock('../../models/stream.model');
jest.mock('../../models/user.model');
jest.mock('../../websockets/streamer.ws', () => ({
  streamerWsHelpers: {
    notifyViewerJoined: jest.fn(),
    notifyViewerLeft: jest.fn(),
  },
}));
jest.mock('../../websockets/viewer.ws', () => ({
  viewerWsHelpers: {
    broadcastStreamStarted: jest.fn(),
    broadcastStreamEnded: jest.fn(),
  },
}));

describe('Stream Service', () => {
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

  const mockStream = {
    id: 'stream-123',
    streamer_id: mockStreamerId,
    platform: 'twitch' as const,
    stream_key: 'stream-key',
    is_live: true,
    created_at: new Date(),
    ended_at: null,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('startStream', () => {
    it('should start stream successfully', async () => {
      (userModel.findById as jest.Mock).mockResolvedValue(mockStreamer);
      (streamModel.findActiveByStreamerId as jest.Mock).mockResolvedValue(null);
      (streamModel.create as jest.Mock).mockResolvedValue(mockStream);

      const result = await streamService.startStream(mockStreamerId, {
        platform: 'twitch',
        streamKey: 'stream-key',
      });

      expect(result).toEqual(mockStream);
      expect(streamModel.create).toHaveBeenCalled();
    });

    it('should throw error if streamer not found', async () => {
      (userModel.findById as jest.Mock).mockResolvedValue(null);

      await expect(
        streamService.startStream(mockStreamerId, {
          platform: 'twitch',
          streamKey: 'stream-key',
        })
      ).rejects.toThrow('Streamer not found');
    });

    it('should throw error if streamer already has active stream', async () => {
      (userModel.findById as jest.Mock).mockResolvedValue(mockStreamer);
      (streamModel.findActiveByStreamerId as jest.Mock).mockResolvedValue(mockStream);

      await expect(
        streamService.startStream(mockStreamerId, {
          platform: 'twitch',
          streamKey: 'stream-key',
        })
      ).rejects.toThrow('Streamer already has an active stream');
    });
  });

  describe('endStream', () => {
    it('should end stream successfully', async () => {
      (streamModel.findById as jest.Mock).mockResolvedValue(mockStream);
      const endedStream = { ...mockStream, is_live: false, ended_at: new Date() };
      (streamModel.endStream as jest.Mock).mockResolvedValue(endedStream);

      const result = await streamService.endStream(mockStream.id, mockStreamerId);

      expect(result).toEqual(endedStream);
      expect(streamModel.endStream).toHaveBeenCalled();
    });

    it('should throw error if stream not found', async () => {
      (streamModel.findById as jest.Mock).mockResolvedValue(null);

      await expect(streamService.endStream('invalid-id', mockStreamerId)).rejects.toThrow(
        'Stream not found'
      );
    });
  });
});

