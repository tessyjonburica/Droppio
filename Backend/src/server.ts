import express, { Express, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import { env } from './config/env';
import { logger } from './utils/logger';
import { createWebSocketServer } from './websockets/server';
import { blockchainListener } from './services/blockchain-listener.service';

// Import routes
import authRoutes from './routes/auth.routes';
import userRoutes from './routes/user.routes';
import streamRoutes from './routes/stream.routes';
import tipRoutes from './routes/tip.routes';
import overlayRoutes from './routes/overlay.routes';
import creatorRoutes from './routes/creator.routes';

const app: Express = express();

// Middleware
app.use(cors({
  origin: true,
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Global error handler
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  logger.error('Unhandled error:', err.message, err.stack);
  res.status(500).json({
    error: 'Internal server error',
    message: env.NODE_ENV === 'development' ? err.message : undefined,
  });
});

// Health check
app.get('/health', (req: Request, res: Response) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/streams', streamRoutes);
app.use('/api/tips', tipRoutes);
app.use('/api/overlay', overlayRoutes);
app.use('/api/creators', creatorRoutes);

// 404 handler
app.use((req: Request, res: Response) => {
  res.status(404).json({ error: 'Route not found' });
});

const PORT = parseInt(env.PORT, 10);

app.listen(PORT, () => {
  logger.info(`Server running on port ${PORT} in ${env.NODE_ENV} mode`);
  
  // Initialize WebSocket server
  createWebSocketServer();
  
  // Start blockchain event listener
  blockchainListener.start().catch((error) => {
    logger.error('Failed to start blockchain listener:', error);
  });
});

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM signal received: closing HTTP server');
  blockchainListener.stop();
  process.exit(0);
});

process.on('SIGINT', () => {
  logger.info('SIGINT signal received: closing HTTP server');
  blockchainListener.stop();
  process.exit(0);
});

export default app;

