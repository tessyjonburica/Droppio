import { WebSocket } from 'ws';
import { logger } from '../utils/logger';
import { OverlayChannelEvent, TipEvent } from '../types/websocket';
import { wsManager } from './manager';
import { overlayModel } from '../models/overlay.model';
import { verifyAccessToken, JwtPayload } from '../utils/jwt';

interface OverlayWebSocketRequest {
  url?: string;
  headers?: { authorization?: string };
}

export const handleOverlayConnection = async (ws: WebSocket, req: OverlayWebSocketRequest): Promise<void> => {
  // Extract creatorId from URL path /ws/overlay/{creatorId}?token=...
  const url = new URL(req.url || '', 'http://localhost');
  const pathParts = url.pathname.split('/');
  const overlayIndex = pathParts.indexOf('overlay');
  const creatorId =
    overlayIndex >= 0 && pathParts[overlayIndex + 1] ? pathParts[overlayIndex + 1] : null;

  if (!creatorId) {
    logger.warn('Overlay connection rejected: Invalid creator ID', { url: req.url });
    ws.close(1008, 'Invalid creator ID');
    return;
  }

  // Extract access_token from query params (Standard for browser WebSockets)
  const accessToken = url.searchParams.get('token');

  if (!accessToken) {
    logger.warn(`Overlay connection rejected: No access token provided. CreatorId: ${creatorId}`);
    ws.close(1008, 'No access token provided');
    return;
  }

  let payload: JwtPayload | null = null;

  // First, try to verify as overlay token (long-lived)
  try {
    const { overlayTokenModel } = await import('../models/overlay-token.model');
    const tokenRecord = await overlayTokenModel.findByToken(accessToken);

    if (tokenRecord && tokenRecord.creator_id === creatorId) {
      logger.info(`Overlay token validated for creator ${creatorId}`);

      // Update last used timestamp
      await overlayTokenModel.updateLastUsed(accessToken).catch(err => {
        logger.warn('Failed to update overlay token last_used_at:', err);
      });

      // Create a pseudo-payload for overlay tokens
      payload = {
        walletAddress: 'overlay-token',
        role: 'creator',
      };
    }
  } catch (overlayTokenError) {
    logger.debug('Not an overlay token, trying JWT verification');
  }

  // If not an overlay token, try standard JWT verification (backward compatibility)
  if (!payload) {
    try {
      payload = verifyAccessToken(accessToken);
      logger.debug(`Standard JWT validated for creator ${creatorId}, wallet: ${payload.walletAddress}`);
    } catch (tokenError) {
      const errorMessage = tokenError instanceof Error ? tokenError.message : 'Unknown token error';
      logger.warn(`Overlay connection rejected: Invalid token. CreatorId: ${creatorId}, Error: ${errorMessage}`);
      ws.close(1008, 'Invalid token');
      return;
    }
  }



  overlayModel
    .findByCreatorId(creatorId)
    .then(async overlay => {
      // Auto-create overlay if it doesn't exist
      if (!overlay) {
        logger.info(`Overlay not found for creator ${creatorId}, creating default overlay...`);
        try {
          overlay = await overlayModel.create(creatorId);
          if (!overlay) {
            logger.error(`Failed to create overlay for creator ${creatorId}`);
            ws.close(1008, 'Failed to create overlay');
            return;
          }
          logger.info(`Created default overlay for creator ${creatorId}`);
        } catch (createError) {
          logger.error(`Error creating overlay for creator ${creatorId}:`, createError);
          ws.close(1008, 'Failed to create overlay');
          return;
        }
      }

      // Add WebSocket to overlay connections map
      wsManager.addOverlayConnection(creatorId, ws);
      logger.info(`Overlay WebSocket connected: creator:${creatorId}, wallet:${payload?.walletAddress || 'unknown'}`);

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
        logger.info(`Overlay WebSocket disconnected: creator:${creatorId}`);
        wsManager.removeOverlayConnection(creatorId);
      });

      ws.on('error', error => {
        logger.error(`Overlay WebSocket error for ${creatorId}:`, error);
        wsManager.removeOverlayConnection(creatorId);
      });
    })
    .catch(error => {
      logger.error(`Overlay connection error for creator ${creatorId}:`, error);
      ws.close(1008, 'Connection error');
    });
};

// Helper functions
export const overlayWsHelpers = {
  sendToOverlay: (streamerId: string, event: OverlayChannelEvent): void => {
    const conn = wsManager.getOverlayConnection(streamerId);
    if (!conn) {
      logger.warn(`No overlay connection found for streamer ${streamerId}`);
      return;
    }

    if (conn.ws.readyState !== WebSocket.OPEN) {
      logger.warn(`Overlay connection for streamer ${streamerId} is not open (state: ${conn.ws.readyState})`);
      return;
    }

    try {
      const message = JSON.stringify({ ...event, timestamp: new Date().toISOString() });
      conn.ws.send(message);
      logger.debug(`Sent ${event.type} to overlay for streamer ${streamerId}`);
    } catch (error) {
      logger.error(`Failed to send to overlay ${streamerId}:`, error);
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

    logger.info(`Sending tip_event to overlay for streamer ${streamerId}:`, {
      tipId: tipData.tipId,
      amount: tipData.amount,
      viewer: tipData.viewer.displayName || tipData.viewer.walletAddress,
    });

    overlayWsHelpers.sendToOverlay(streamerId, event);
  },
};
