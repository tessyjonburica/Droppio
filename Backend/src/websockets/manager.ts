// WebSocket Connection Manager

import { WebSocket } from 'ws';
import { logger } from '../utils/logger';

// Connection maps
export interface WebSocketConnection {
  ws: WebSocket;
  userId?: string;
  streamId?: string;
  streamerId?: string;
  lastPing: Date;
}

// Connection storage
export const wsConnections = {
  // Map of streamerId -> WebSocket connection
  streamers: new Map<string, WebSocketConnection>(),

  // Map of streamId -> Set of viewer WebSocket connections
  viewers: new Map<string, Set<WebSocketConnection>>(),

  // Map of streamerId -> overlay WebSocket connection
  overlays: new Map<string, WebSocketConnection>(),
};

// Connection management functions
export const wsManager = {
  // Add connection
  addStreamerConnection: (streamerId: string, ws: WebSocket, userId?: string): void => {
    const connection: WebSocketConnection = {
      ws,
      userId,
      streamerId,
      lastPing: new Date(),
    };
    wsConnections.streamers.set(streamerId, connection);
    logger.debug(`Added streamer connection: ${streamerId}`);
  },

  addViewerConnection: (streamId: string, ws: WebSocket, userId?: string): void => {
    const connection: WebSocketConnection = {
      ws,
      userId,
      streamId,
      lastPing: new Date(),
    };

    if (!wsConnections.viewers.has(streamId)) {
      wsConnections.viewers.set(streamId, new Set());
    }

    wsConnections.viewers.get(streamId)!.add(connection);
    logger.debug(`Added viewer connection: ${streamId}`);
  },

  addOverlayConnection: (streamerId: string, ws: WebSocket): void => {
    const connection: WebSocketConnection = {
      ws,
      streamerId,
      lastPing: new Date(),
    };
    wsConnections.overlays.set(streamerId, connection);
    logger.debug(`Added overlay connection: ${streamerId}`);
  },

  // Remove connection
  removeStreamerConnection: (streamerId: string): void => {
    wsConnections.streamers.delete(streamerId);
    logger.debug(`Removed streamer connection: ${streamerId}`);
  },

  removeViewerConnection: (streamId: string, ws: WebSocket): void => {
    const viewers = wsConnections.viewers.get(streamId);
    if (viewers) {
      for (const conn of viewers) {
        if (conn.ws === ws) {
          viewers.delete(conn);
          break;
        }
      }
      if (viewers.size === 0) {
        wsConnections.viewers.delete(streamId);
      }
    }
    logger.debug(`Removed viewer connection: ${streamId}`);
  },

  removeOverlayConnection: (streamerId: string): void => {
    wsConnections.overlays.delete(streamerId);
    logger.debug(`Removed overlay connection: ${streamerId}`);
  },

  // Get connections
  getStreamerConnection: (streamerId: string): WebSocketConnection | undefined => {
    return wsConnections.streamers.get(streamerId);
  },

  getViewerConnections: (streamId: string): Set<WebSocketConnection> => {
    return wsConnections.viewers.get(streamId) || new Set();
  },

  getOverlayConnection: (streamerId: string): WebSocketConnection | undefined => {
    return wsConnections.overlays.get(streamerId);
  },

  // Cleanup and heartbeat management
  startHeartbeatCleanup: (): void => {
    // Heartbeat interval: ping every 30 seconds
    const pingInterval = setInterval(() => {
      const now = new Date();
      const timeout = 60000; // 60 seconds timeout

      // Ping streamers
      for (const [streamerId, conn] of wsConnections.streamers.entries()) {
        if (conn.ws.readyState === WebSocket.OPEN) {
          try {
            conn.ws.ping();
            conn.lastPing = now;
          } catch {
            wsManager.removeStreamerConnection(streamerId);
          }
        } else {
          wsManager.removeStreamerConnection(streamerId);
        }
      }

      // Ping viewers
      for (const [streamId, viewers] of wsConnections.viewers.entries()) {
        for (const conn of viewers) {
          if (conn.ws.readyState === WebSocket.OPEN) {
            try {
              conn.ws.ping();
              conn.lastPing = now;
            } catch {
              wsManager.removeViewerConnection(streamId, conn.ws);
            }
          } else {
            wsManager.removeViewerConnection(streamId, conn.ws);
          }
        }
      }

      // Ping overlays
      for (const [streamerId, conn] of wsConnections.overlays.entries()) {
        if (conn.ws.readyState === WebSocket.OPEN) {
          try {
            conn.ws.ping();
            conn.lastPing = now;
          } catch {
            wsManager.removeOverlayConnection(streamerId);
          }
        } else {
          wsManager.removeOverlayConnection(streamerId);
        }
      }
    }, 30000);

    // Cleanup interval: remove dead connections every 2 minutes
    const cleanupInterval = setInterval(() => {
      wsManager.cleanupClosedConnections();
    }, 120000);

    // Store intervals for cleanup on shutdown
    (wsManager as unknown as { intervals: NodeJS.Timeout[] }).intervals = [
      pingInterval,
      cleanupInterval,
    ];
  },

  cleanupClosedConnections: (): void => {
    // Remove all closed connections from maps
    for (const [streamerId, conn] of wsConnections.streamers.entries()) {
      if (conn.ws.readyState !== WebSocket.OPEN) {
        wsManager.removeStreamerConnection(streamerId);
      }
    }

    for (const [streamId, viewers] of wsConnections.viewers.entries()) {
      for (const conn of viewers) {
        if (conn.ws.readyState !== WebSocket.OPEN) {
          wsManager.removeViewerConnection(streamId, conn.ws);
        }
      }
    }

    for (const [streamerId, conn] of wsConnections.overlays.entries()) {
      if (conn.ws.readyState !== WebSocket.OPEN) {
        wsManager.removeOverlayConnection(streamerId);
      }
    }
  },

  shutdown: (): void => {
    // Close all connections
    for (const conn of wsConnections.streamers.values()) {
      if (conn.ws.readyState === WebSocket.OPEN) {
        conn.ws.close();
      }
    }
    for (const viewers of wsConnections.viewers.values()) {
      for (const conn of viewers) {
        if (conn.ws.readyState === WebSocket.OPEN) {
          conn.ws.close();
        }
      }
    }
    for (const conn of wsConnections.overlays.values()) {
      if (conn.ws.readyState === WebSocket.OPEN) {
        conn.ws.close();
      }
    }

    // Clear intervals
    const intervals = (wsManager as unknown as { intervals?: NodeJS.Timeout[] }).intervals;
    if (intervals) {
      intervals.forEach((interval) => clearInterval(interval));
    }
  },
};
