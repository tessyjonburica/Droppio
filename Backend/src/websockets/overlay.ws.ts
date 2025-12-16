import { WebSocket } from 'ws';
import { logger } from '../utils/logger';
import { OverlayChannelEvent, TipEvent } from '../types/websocket';
import { wsManager } from './manager';
import { overlayModel } from '../models/overlay.model';

interface OverlayWebSocketRequest {
  url?: string;
  headers?: { authorization?: string };
}

export const handleOverlayConnection = (ws: WebSocket, req: OverlayWebSocketRequest): void => {
  // Extract creatorId from URL path /ws/overlay/{creatorId}?token=...
  const url = new URL(req.url || '', 'http://localhost');
  const pathParts = url.pathname.split('/');
  const overlayIndex = pathParts.indexOf('overlay');
  const creatorId =
    overlayIndex >= 0 && pathParts[overlayIndex + 1] ? pathParts[overlayIndex + 1] : null;

  if (!creatorId) {
    ws.close(1008, 'Invalid creator ID');
    return;
  }

  // Extract access_token from query params or Authorization header
  const accessToken = url.searchParams.get('token') || 
    (req.headers?.authorization && req.headers.authorization.split(' ')[1]);

  if (!accessToken) {
    ws.close(1008, 'No access token provided');
    return;
  }

  // Validate token against overlays table
  // For MVP: verify overlay exists for creatorId
  // In production: verify access_token matches overlay.access_token
  overlayModel
    .findByStreamerId(creatorId)
    .then((overlay) => {
      if (!overlay) {
        ws.close(1008, 'Overlay not found for creator');
        return;
      }

      // Add WebSocket to overlay connections map
      wsManager.addOverlayConnection(creatorId, ws);

      // Handle incoming messages
      ws.on('message', (data: Buffer) => {
        try {
          const message = JSON.parse(data.toString());
          if (message.type === 'pong') {
            const conn = wsManager.getOverlayConnection(creatorId);
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
        wsManager.removeOverlayConnection(creatorId);
      });

      ws.on('error', (error) => {
        logger.error(`Overlay WebSocket error for ${creatorId}:`, error);
        wsManager.removeOverlayConnection(creatorId);
      });

      logger.info(`Overlay WebSocket connected: creator:${creatorId}`);
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
