// WebSocket Server

import { WebSocketServer, WebSocket } from 'ws';
import { createServer } from 'http';
import { parse } from 'url';
import { env } from '../config/env';
import { logger } from '../utils/logger';
import { handleStreamerConnection } from './streamer.ws';
import { handleViewerConnection } from './viewer.ws';
import { handleOverlayConnection } from './overlay.ws';
import { wsManager } from './manager';

let wss: WebSocketServer | null = null;

export const createWebSocketServer = (): WebSocketServer => {
  const httpServer = createServer();
  wss = new WebSocketServer({ server: httpServer });

  wss.on('connection', (ws: WebSocket, req) => {
    logger.info(`New WebSocket connection attempt: ${req.url}`);

    const parsedUrl = parse(req.url || '', true);
    const pathname = parsedUrl.pathname || '';

    // Route based on path
    if (pathname.startsWith('/ws/streamer/')) {
      handleStreamerConnection(ws, req);
    } else if (pathname.startsWith('/ws/viewer/')) {
      handleViewerConnection(ws, req);
    } else if (pathname.startsWith('/ws/overlay/')) {
      handleOverlayConnection(ws, req);
    } else {
      ws.close(1008, 'Invalid WebSocket path');
    }
  });

  // Start heartbeat cleanup
  wsManager.startHeartbeatCleanup();

  const WS_PORT = parseInt(env.WS_PORT, 10);
  httpServer.listen(WS_PORT, () => {
    logger.info(`WebSocket server running on port ${WS_PORT}`);
  });

  // Graceful shutdown
  process.on('SIGTERM', () => {
    logger.info('SIGTERM signal received: closing WebSocket server');
    wsManager.shutdown();
    if (wss) {
      wss.close(() => {
        httpServer.close(() => {
          process.exit(0);
        });
      });
    }
  });

  process.on('SIGINT', () => {
    logger.info('SIGINT signal received: closing WebSocket server');
    wsManager.shutdown();
    if (wss) {
      wss.close(() => {
        httpServer.close(() => {
          process.exit(0);
        });
      });
    }
  });

  return wss;
};

// WebSocket server routes
export const wsRoutes = {
  streamer: '/ws/streamer/:streamerId',
  viewer: '/ws/viewer/:streamId',
  overlay: '/ws/overlay/:streamerId',
};
