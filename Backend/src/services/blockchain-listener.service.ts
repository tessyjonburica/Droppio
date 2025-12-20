// Blockchain Event Listener Service
// Listens to Droppio contract TipSent events and bridges to WebSocket

import { ethers } from 'ethers';
import { env } from '../config/env';
import { logger } from '../utils/logger';
import { userModel } from '../models/user.model';
import { tipModel } from '../models/tip.model';
import { streamModel } from '../models/stream.model';
import { overlayWsHelpers } from '../websockets/overlay.ws';
import { wsManager } from '../websockets/manager';

// Droppio contract ABI (only TipSent event)
const DROPPIO_ABI = [
  'event TipSent(address indexed from, address indexed to, uint256 amount, bytes32 sessionId)',
];

interface TipSentEvent {
  from: string;
  to: string;
  amount: bigint;
  sessionId: string;
  txHash: string;
  blockNumber: number;
}

class BlockchainListener {
  private provider: ethers.WebSocketProvider | null = null;
  private contract: ethers.Contract | null = null;
  private isListening = false;
  private reconnectTimeout: NodeJS.Timeout | null = null;
  private reconnectAttempts = 0;
  private readonly maxReconnectAttempts = 10;
  private readonly reconnectDelay = 5000; // 5 seconds

  /**
   * Initialize WebSocket provider and contract
   */
  private async initializeProvider(): Promise<void> {
    try {
      const wsRpcUrl = env.BASE_WS_RPC;

      if (!wsRpcUrl) {
        throw new Error('BASE_WS_RPC is not defined');
      }

      if (!wsRpcUrl.startsWith('ws://') && !wsRpcUrl.startsWith('wss://')) {
        throw new Error('BASE_WS_RPC must start with ws:// or wss://');
      }

      this.provider = new ethers.WebSocketProvider(wsRpcUrl);

      this.contract = new ethers.Contract(
        env.DROPPIO_CONTRACT_ADDRESS,
        DROPPIO_ABI,
        this.provider
      );

      // WS-level disconnect handling (ethers v6 safe)
      (this.provider as any)._websocket?.on('close', () => {
        logger.warn('Blockchain WS closed — reconnecting');
        this.handleDisconnect();
      });


      this.provider.on('error', (error) => {
        logger.error('Blockchain provider error:', error);
        this.handleDisconnect();
      });

      logger.info(
        `Blockchain listener initialized for contract: ${env.DROPPIO_CONTRACT_ADDRESS}`
      );
    } catch (error) {
      logger.error('Failed to initialize blockchain provider:', error);
      throw error;
    }
  }


  /**
   * Start listening to TipSent events
   */
  async start(): Promise<void> {
    if (this.isListening) {
      logger.warn('Blockchain listener already running');
      return;
    }

    try {
      await this.initializeProvider();

      if (!this.contract || !this.provider) {
        throw new Error('Provider or contract not initialized');
      }

      // Listen to TipSent events
      this.contract.on('TipSent', async (from: string, to: string, amount: bigint, sessionId: string, event: ethers.Log) => {
        await this.handleTipSentEvent({
          from: from.toLowerCase(),
          to: to.toLowerCase(),
          amount,
          sessionId,
          txHash: event.transactionHash,
          blockNumber: event.blockNumber,
        });
      });

      this.isListening = true;
      this.reconnectAttempts = 0;
      logger.info('Blockchain listener started - listening for TipSent events');
    } catch (error) {
      logger.error('Failed to start blockchain listener:', error);
      this.handleDisconnect();
    }
  }

  /**
   * Handle TipSent event from contract
   */
  private async handleTipSentEvent(event: TipSentEvent): Promise<void> {
    try {
      logger.info(`TipSent event received: ${event.txHash}`, {
        from: event.from,
        to: event.to,
        amount: event.amount.toString(),
      });

      // Find creator by wallet address
      const creator = await userModel.findByWalletAddress(event.to);
      if (!creator) {
        logger.warn(`Creator not found for wallet: ${event.to}`);
        return;
      }

      // Find viewer by wallet address (create if doesn't exist)
      let viewer = await userModel.findByWalletAddress(event.from);
      if (!viewer) {
        viewer = await userModel.create({
          walletAddress: event.from,
          role: 'viewer',
        });
        if (!viewer) {
          logger.error(`Failed to create viewer: ${event.from}`);
          return;
        }
      }

      // Find active stream for creator (using streamer_id which maps to creator_id in DB)
      const activeStream = await streamModel.findActiveByStreamerId(creator.id);
      const streamId = activeStream?.id || null;

      // Convert amount from wei to ETH (18 decimals)
      const amountEth = ethers.formatEther(event.amount);

      // Persist tip to database
      // Note: Schema uses creator_id, but we need to map it correctly
      const tip = await tipModel.createFromBlockchain({
        creatorId: creator.id,
        viewerId: viewer.id,
        streamId,
        amountEth,
        txHash: event.txHash,
        tipMode: streamId ? 'live' : 'offline',
      });

      if (!tip) {
        logger.error(`Failed to persist tip: ${event.txHash}`);
        return;
      }

      logger.info(`Tip persisted: ${tip.id}`, {
        creatorId: creator.id,
        viewerId: viewer.id,
        amountEth,
      });

      // Emit WebSocket event to creator channel
      this.emitTipSentEvent(creator.id, {
        creatorId: creator.id,
        tipperAddress: event.from,
        amountEth,
        txHash: event.txHash,
        tipMode: streamId ? 'live' : 'offline',
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      logger.error('Error handling TipSent event:', error);
    }
  }

  /**
   * Emit TIP_SENT event to creator channel via WebSocket
   */
  private emitTipSentEvent(creatorId: string, payload: {
    creatorId: string;
    tipperAddress: string;
    amountEth: string;
    txHash: string;
    tipMode: string;
    timestamp: string;
  }): void {
    // Send to overlay connection if exists
    const overlayConn = wsManager.getOverlayConnection(creatorId);
    if (overlayConn && overlayConn.ws.readyState === 1) { // WebSocket.OPEN
      try {
        const event = {
          type: 'TIP_SENT',
          ...payload,
        };
        overlayConn.ws.send(JSON.stringify(event));
        logger.debug(`TIP_SENT event sent to overlay: ${creatorId}`);
      } catch (error) {
        logger.error(`Failed to send TIP_SENT to overlay ${creatorId}:`, error);
      }
    }

    // Also send to streamer connection if exists
    const streamerConn = wsManager.getStreamerConnection(creatorId);
    if (streamerConn && streamerConn.ws.readyState === 1) {
      try {
        const event = {
          type: 'TIP_SENT',
          ...payload,
        };
        streamerConn.ws.send(JSON.stringify(event));
        logger.debug(`TIP_SENT event sent to streamer: ${creatorId}`);
      } catch (error) {
        logger.error(`Failed to send TIP_SENT to streamer ${creatorId}:`, error);
      }
    }
  }

  /**
   * Handle provider disconnection
   */
  private handleDisconnect(): void {
    this.isListening = false;

    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      logger.error('Max reconnect attempts reached. Stopping blockchain listener.');
      return;
    }

    this.reconnectAttempts++;
    const delay = this.reconnectDelay * this.reconnectAttempts;

    logger.warn(`Blockchain provider disconnected. Reconnecting in ${delay}ms (attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts})`);

    this.reconnectTimeout = setTimeout(() => {
      this.start().catch((error) => {
        logger.error('Reconnection failed:', error);
      });
    }, delay);
  }

  /**
   * Stop listening to events
   */
  stop(): void {
    this.isListening = false;

    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
    }

    if (this.contract) {
      this.contract.removeAllListeners('TipSent');
    }

    if (this.provider) {
      this.provider.destroy();
      this.provider = null;
    }

    logger.info('Blockchain listener stopped');
  }
}

// Singleton instance
export const blockchainListener = new BlockchainListener();

