import { WebSocket } from 'ws';
import { logger } from '../utils/logger';
import { ViewerChannelEvent, StreamStartedEvent, StreamEndedEvent } from '../types/websocket';
import { Stream } from '../types/stream';
import { User } from '../types/user';
import { wsManager } from './manager';
import { streamModel } from '../models/stream.model';
import { streamerWsHelpers } from './streamer.ws';

interface ViewerWebSocketRequest {
  url?: string;
}

export const handleViewerConnection = (ws: WebSocket, req: ViewerWebSocketRequest): void => {
  // Extract streamId from URL path /ws/viewer/{streamId}
  const url = new URL(req.url || '', 'http://localhost');
  const pathParts = url.pathname.split('/');
  const streamIdIndex = pathParts.indexOf('viewer');
  const streamId = streamIdIndex >= 0 && pathParts[streamIdIndex + 1] ? pathParts[streamIdIndex + 1] : null;

  if (!streamId) {
    ws.close(1008, 'Invalid stream ID');
    return;
  }

  // Validate stream exists and is live
  streamModel
    .findById(streamId)
    .then((stream) => {
      if (!stream) {
        ws.close(1008, 'Stream not found');
        return;
      }

      if (!stream.is_live) {
        ws.close(1008, 'Stream is not live');
        return;
      }

      // Add WebSocket to viewer connections map
      wsManager.addViewerConnection(streamId, ws);

      // Emit viewer_joined event to streamer channel
      const viewers = wsManager.getViewerConnections(streamId);
      streamerWsHelpers.notifyViewerJoined(stream.streamer_id, 'anonymous', viewers.size);

      // Handle incoming messages
      ws.on('message', (data: Buffer) => {
        try {
          const message = JSON.parse(data.toString());
          if (message.type === 'pong') {
            const viewers = wsManager.getViewerConnections(streamId);
            for (const conn of viewers) {
              if (conn.ws === ws) {
                conn.lastPing = new Date();
                break;
              }
            }
          }
        } catch {
          // Ignore invalid messages
        }
      });

      // Handle disconnect
      ws.on('close', () => {
        wsManager.removeViewerConnection(streamId, ws);
        const remainingViewers = wsManager.getViewerConnections(streamId);
        streamerWsHelpers.notifyViewerLeft(stream.streamer_id, 'anonymous', remainingViewers.size);
      });

      ws.on('error', (error) => {
        logger.error(`Viewer WebSocket error for ${streamId}:`, error);
        wsManager.removeViewerConnection(streamId, ws);
      });

      logger.info(`Viewer WebSocket connected: ${streamId}`);
    })
    .catch((error) => {
      logger.error('Viewer connection error:', error);
      ws.close(1008, 'Connection error');
    });
};

// Helper functions
export const viewerWsHelpers = {
  sendToViewer: (ws: WebSocket, event: ViewerChannelEvent): void => {
    if (ws.readyState === WebSocket.OPEN) {
      try {
        ws.send(JSON.stringify({ ...event, timestamp: new Date().toISOString() }));
      } catch (error) {
        logger.error('Failed to send to viewer:', error);
      }
    }
  },

  broadcastToViewers: (streamId: string, event: ViewerChannelEvent): void => {
    const viewers = wsManager.getViewerConnections(streamId);
    const eventWithTimestamp = { ...event, timestamp: new Date().toISOString() };

    for (const conn of viewers) {
      if (conn.ws.readyState === WebSocket.OPEN) {
        try {
          conn.ws.send(JSON.stringify(eventWithTimestamp));
        } catch (error) {
          logger.error(`Failed to broadcast to viewer:`, error);
        }
      }
    }
  },

  broadcastStreamStarted: (stream: Stream, streamer: User): void => {
    const event: StreamStartedEvent = {
      type: 'stream_started',
      data: {
        streamId: stream.id,
        streamer: {
          id: streamer.id,
          displayName: streamer.display_name,
          avatarUrl: streamer.avatar_url,
        },
        platform: stream.platform,
        timestamp: new Date().toISOString(),
      },
    };
    viewerWsHelpers.broadcastToViewers(stream.id, event);
  },

  broadcastStreamEnded: (streamId: string): void => {
    const event: StreamEndedEvent = {
      type: 'stream_ended',
      data: {
        streamId,
        timestamp: new Date().toISOString(),
      },
    };
    viewerWsHelpers.broadcastToViewers(streamId, event);
  },
};
