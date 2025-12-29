// WebSocket Server

import { Server } from 'http';
import { WebSocketServer, WebSocket } from 'ws';
import { parse } from 'url';
import { logger } from '../utils/logger';
import { handleStreamerConnection } from './streamer.ws';
import { handleViewerConnection } from './viewer.ws';
import { handleOverlayConnection } from './overlay.ws';
import { wsManager } from './manager';

let wss: WebSocketServer | null = null;

export const createWebSocketServer = (server: Server): WebSocketServer => {
  wss = new WebSocketServer({ server });

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

  logger.info('WebSocket server initialized (shared port)');

  return wss;
};

// WebSocket server routes
export const wsRoutes = {
  streamer: '/ws/streamer/:streamerId',
  viewer: '/ws/viewer/:streamId',
  overlay: '/ws/overlay/:streamerId',
};
