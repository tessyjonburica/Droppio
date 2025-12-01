import { WebSocket } from 'ws';
import { logger } from '../utils/logger';
import { OverlayChannelEvent, TipEvent } from '../types/websocket';
import { wsManager } from './manager';
import { verifyAccessToken, JwtPayload } from '../utils/jwt';
import { userModel } from '../models/user.model';

interface OverlayWebSocketRequest {
  url?: string;
  headers?: { authorization?: string };
}

export const handleOverlayConnection = (ws: WebSocket, req: OverlayWebSocketRequest): void => {
  // Extract streamerId from URL path /ws/overlay/{streamerId}
  const url = new URL(req.url || '', 'http://localhost');
  const pathParts = url.pathname.split('/');
  const streamerIdIndex = pathParts.indexOf('overlay');
  const streamerId =
    streamerIdIndex >= 0 && pathParts[streamerIdIndex + 1] ? pathParts[streamerIdIndex + 1] : null;

  if (!streamerId) {
    ws.close(1008, 'Invalid streamer ID');
    return;
  }

  // Authenticate WebSocket connection
  const authHeader = req.headers?.authorization;
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
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

  // Validate streamer exists
  userModel
    .findByWalletAddress(payload.walletAddress)
    .then((user) => {
      if (!user) {
        ws.close(1008, 'User not found');
        return;
      }

      if (user.id !== streamerId) {
        ws.close(1008, 'Unauthorized');
        return;
      }

      // Add WebSocket to overlay connections map
      wsManager.addOverlayConnection(streamerId, ws);

      // Handle incoming messages
      ws.on('message', (data: Buffer) => {
        try {
          const message = JSON.parse(data.toString());
          if (message.type === 'pong') {
            const conn = wsManager.getOverlayConnection(streamerId);
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
        wsManager.removeOverlayConnection(streamerId);
      });

      ws.on('error', (error) => {
        logger.error(`Overlay WebSocket error for ${streamerId}:`, error);
        wsManager.removeOverlayConnection(streamerId);
      });

      logger.info(`Overlay WebSocket connected: ${streamerId}`);
    })
    .catch((error) => {
      logger.error('Overlay connection error:', error);
      ws.close(1008, 'Connection error');
    });
};

// Helper functions
export const overlayWsHelpers = {
  sendToOverlay: (streamerId: string, event: OverlayChannelEvent): void => {
    const conn = wsManager.getOverlayConnection(streamerId);
    if (conn && conn.ws.readyState === WebSocket.OPEN) {
      try {
        conn.ws.send(JSON.stringify({ ...event, timestamp: new Date().toISOString() }));
      } catch (error) {
        logger.error(`Failed to send to overlay ${streamerId}:`, error);
      }
    }
  },

  notifyTipEvent: (
    streamerId: string,
    tipData: {
      tipId: string;
      amount: string;
      viewer: {
        displayName: string | null;
        walletAddress: string;
      };
    }
  ): void => {
    const event: TipEvent = {
      type: 'tip_event',
      data: {
        tipId: tipData.tipId,
        amount: tipData.amount,
        viewer: tipData.viewer,
        timestamp: new Date().toISOString(),
      },
    };
    overlayWsHelpers.sendToOverlay(streamerId, event);
  },
};
