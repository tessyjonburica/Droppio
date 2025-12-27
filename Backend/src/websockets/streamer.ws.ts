import { WebSocket } from 'ws';
import { logger } from '../utils/logger';
import {
  StreamerChannelEvent,
  StreamerTipReceivedEvent,
  ViewerJoinedEvent,
  ViewerLeftEvent,
} from '../types/websocket';
import { wsManager } from './manager';
import { verifyAccessToken, JwtPayload } from '../utils/jwt';
import { userModel } from '../models/user.model';

interface StreamerWebSocketRequest {
  url?: string;
  headers?: { authorization?: string };
}

export const handleStreamerConnection = (ws: WebSocket, req: StreamerWebSocketRequest): void => {
  // Extract streamerId from URL path /ws/streamer/{streamerId}
  const url = new URL(req.url || '', 'http://localhost');
  const pathParts = url.pathname.split('/');
  const streamerIdIndex = pathParts.indexOf('streamer');
  const streamerId = streamerIdIndex >= 0 && pathParts[streamerIdIndex + 1] ? pathParts[streamerIdIndex + 1] : null;

  if (!streamerId) {
    ws.close(1008, 'Invalid streamer ID');
    return;
  }

  // Authenticate WebSocket connection
  // Check Authorization header OR query param token
  const authHeader = req.headers?.authorization;
  const queryToken = url.searchParams.get('token');
  const token = (authHeader && authHeader.split(' ')[1]) || queryToken;

  if (!token) {
    logger.warn(`Streamer connection rejected: No token provided. StreamerId: ${streamerId}`);
    ws.close(1008, 'No authentication token');
    return;
  }

  // Verify JWT token
  let payload: JwtPayload;
  try {
    payload = verifyAccessToken(token);
  } catch {
    ws.close(1008, 'Invalid token');
    return;
  }

  // Validate streamer exists and matches authenticated user
  userModel
    .findByWalletAddress(payload.walletAddress)
    .then((user) => {
      if (!user) {
        logger.warn(`Streamer connection rejected: User not found. StreamerId: ${streamerId}, User: ${payload.walletAddress}`);
        ws.close(1008, 'User not found');
        return;
      }

      if (user.id !== streamerId) {
        logger.warn(`Streamer connection rejected: ID mismatch. StreamerId: ${streamerId}, UserID: ${user.id}`);
        ws.close(1008, 'Unauthorized');
        return;
      }

      if (user.role !== 'creator') {
        logger.warn(`Streamer connection rejected: User is not a creator. StreamerId: ${streamerId}`);
        ws.close(1008, 'User is not a creator');
        return;
      }

      // Add WebSocket to streamer connections map
      wsManager.addStreamerConnection(streamerId, ws, user.id);

      // Handle incoming messages
      ws.on('message', (data: Buffer) => {
        try {
          const message = JSON.parse(data.toString());
          if (message.type === 'pong') {
            const conn = wsManager.getStreamerConnection(streamerId);
            if (conn) {
              conn.lastPing = new Date();
            }
          }
        } catch {
          // Ignore invalid messages
        }
      });

      // Handle disconnect
      ws.on('close', () => {
        wsManager.removeStreamerConnection(streamerId);
      });

      ws.on('error', (error) => {
        logger.error(`Streamer WebSocket error for ${streamerId}:`, error);
        wsManager.removeStreamerConnection(streamerId);
      });

      logger.info(`Streamer WebSocket connected: ${streamerId}`);
    })
    .catch((error) => {
      logger.error('Streamer connection error:', error);
      ws.close(1008, 'Connection error');
    });
};

// Helper functions
export const streamerWsHelpers = {
  sendToStreamer: (streamerId: string, event: StreamerChannelEvent): void => {
    const conn = wsManager.getStreamerConnection(streamerId);
    if (conn && conn.ws.readyState === WebSocket.OPEN) {
      try {
        conn.ws.send(JSON.stringify({ ...event, timestamp: new Date().toISOString() }));
      } catch (error) {
        logger.error(`Failed to send to streamer ${streamerId}:`, error);
      }
    }
  },

  notifyTipReceived: (
    streamerId: string,
    tipData: {
      tipId: string;
      amount: string;
      viewer: {
        id: string;
        walletAddress: string;
        displayName: string | null;
      };
    }
  ): void => {
    const event: StreamerTipReceivedEvent = {
      type: 'tip_received',
      data: {
        tipId: tipData.tipId,
        amount: tipData.amount,
        viewer: tipData.viewer,
        timestamp: new Date().toISOString(),
      },
    };
    streamerWsHelpers.sendToStreamer(streamerId, event);
  },

  notifyViewerJoined: (streamerId: string, viewerId: string, viewerCount: number): void => {
    const event: ViewerJoinedEvent = {
      type: 'viewer_joined',
      data: {
        viewerId,
        viewerCount,
        timestamp: new Date().toISOString(),
      },
    };
    streamerWsHelpers.sendToStreamer(streamerId, event);
  },

  notifyViewerLeft: (streamerId: string, viewerId: string, viewerCount: number): void => {
    const event: ViewerLeftEvent = {
      type: 'viewer_left',
      data: {
        viewerId,
        viewerCount,
        timestamp: new Date().toISOString(),
      },
    };
    streamerWsHelpers.sendToStreamer(streamerId, event);
  },
};
