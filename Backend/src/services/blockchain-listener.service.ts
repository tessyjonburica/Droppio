// Blockchain Event Listener Service
// Listens to Droppio contract TipSent events and bridges to WebSocket

import { ethers } from 'ethers';
import { env } from '../config/env';
import { logger } from '../utils/logger';
import { userModel } from '../models/user.model';
import { tipModel } from '../models/tip.model';
import { streamModel } from '../models/stream.model';
import { wsManager } from '../websockets/manager';
import { streamerWsHelpers } from '../websockets/streamer.ws';
import { overlayWsHelpers } from '../websockets/overlay.ws';

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

      this.contract = new ethers.Contract(env.DROPPIO_CONTRACT_ADDRESS, DROPPIO_ABI, this.provider);

      // WS-level disconnect handling (ethers v6 safe)
      (this.provider as any)._websocket?.on('close', () => {
        logger.warn('Blockchain WS closed — reconnecting');
        this.handleDisconnect();
      });

      this.provider.on('error', error => {
        logger.error('Blockchain provider error:', error);
        this.handleDisconnect();
      });

      logger.info(`Blockchain listener initialized for contract: ${env.DROPPIO_CONTRACT_ADDRESS}`);
    } catch (error) {
      logger.error('Failed to initialize blockchain provider:', error);
      throw error;
    }
  }

  /**
   * Process historical TipSent events (catch up on missed tips)
   */
  private async processHistoricalEvents(fromBlock: number, toBlock: number): Promise<void> {
    if (!this.contract || !this.provider) {
      logger.warn('Cannot process historical events: contract or provider not initialized');
      return;
    }

    try {
      logger.info(`Processing historical TipSent events from block ${fromBlock} to ${toBlock}`);
      
      // Query past events
      const filter = this.contract.filters.TipSent();
      const events = await this.contract.queryFilter(filter, fromBlock, toBlock);
      
      logger.info(`Found ${events.length} historical TipSent events to process`);
      
      // Process each event
      for (const event of events) {
        // Type guard: EventLog has args, Log doesn't
        if (!('args' in event) || !event.args) continue;
        
        const [from, to, amount, sessionId] = event.args;
        await this.handleTipSentEvent({
          from: from.toLowerCase(),
          to: to.toLowerCase(),
          amount,
          sessionId,
          txHash: event.transactionHash,
          blockNumber: event.blockNumber,
        });
      }
      
      logger.info(`Finished processing ${events.length} historical events`);
    } catch (error) {
      logger.error('Error processing historical events:', error);
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

      // Process historical events from the last 1000 blocks (catch up on missed tips)
      try {
        const currentBlock = await this.provider.getBlockNumber();
        const fromBlock = Math.max(0, currentBlock - 1000); // Last 1000 blocks
        await this.processHistoricalEvents(fromBlock, currentBlock);
      } catch (historicalError) {
        logger.warn('Failed to process historical events (continuing anyway):', historicalError);
      }

      // Listen to NEW TipSent events going forward
      this.contract.on(
        'TipSent',
        async (from: string, to: string, amount: bigint, sessionId: string, event: ethers.Log) => {
          logger.info(`NEW TipSent event detected: ${event.transactionHash}`);
          await this.handleTipSentEvent({
            from: from.toLowerCase(),
            to: to.toLowerCase(),
            amount,
            sessionId,
            txHash: event.transactionHash,
            blockNumber: event.blockNumber,
          });
        }
      );

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

      // Find creator by wallet address (case-insensitive)
      const creator = await userModel.findByWalletAddress(event.to);
      if (!creator) {
        logger.warn(`Creator not found for wallet: ${event.to}. Tip will be skipped.`);
        logger.warn(`Available creators in database may not match this wallet address.`);
        return;
      }
      
      logger.info(`Found creator: ${creator.id} (${creator.display_name || creator.wallet_address}) for wallet ${event.to}`);

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
      let tip;
      try {
        tip = await tipModel.createFromBlockchain({
          creatorId: creator.id,
          viewerId: viewer.id,
          streamId,
          amountEth,
          txHash: event.txHash,
          tipMode: streamId ? 'live' : 'offline',
        });

        if (!tip) {
          logger.error(`Failed to persist tip: ${event.txHash} - createFromBlockchain returned null`);
          return;
        }
      } catch (dbError: any) {
        // Check if error is due to duplicate tx_hash (unique constraint violation)
        const isDuplicateError = 
          dbError?.message?.includes('duplicate') || 
          dbError?.message?.includes('unique') ||
          dbError?.code === '23505' || 
          dbError?.code === 'PGRST116';
          
        if (isDuplicateError) {
          logger.info(`Tip with txHash ${event.txHash} already exists (duplicate detected), fetching existing tip`);
          // Try to find existing tip by txHash
          const existingTips = await tipModel.findByCreatorId(creator.id);
          const existingTip = existingTips.find(t => t.tx_hash?.toLowerCase() === event.txHash.toLowerCase());
          
          if (existingTip) {
            tip = existingTip;
            logger.info(`Found existing tip ${existingTip.id} for txHash ${event.txHash} - will still send WebSocket event`);
            // Continue to send WebSocket event even for duplicates
          } else {
            logger.warn(`Duplicate tip detected but could not find existing tip for txHash ${event.txHash}`);
            // Still try to send WebSocket event in case it's a new connection
            tip = null; // Set to null so we skip WebSocket events
            return;
          }
        } else {
          logger.error(`Failed to persist tip: ${event.txHash}`, {
            error: dbError?.message || dbError,
            code: dbError?.code,
            stack: dbError?.stack,
          });
          return;
        }
      }

      if (tip) {
        logger.info(`Tip persisted: ${tip.id}`, {
          creatorId: creator.id,
          viewerId: viewer.id,
          amountEth,
          txHash: event.txHash,
        });
      } else {
        logger.warn(`Tip processing completed but tip is null for txHash: ${event.txHash}`);
      }

      // Always emit WebSocket events if tip exists (even if it was a duplicate)
      if (tip) {
        // Emit tip_received event to streamer dashboard (for dashboard updates)
        logger.info(`Sending tip_received event to streamer ${creator.id}`, {
          tipId: tip.id,
          amount: amountEth,
          viewerId: viewer.id,
          txHash: event.txHash,
        });
        streamerWsHelpers.notifyTipReceived(creator.id, {
          tipId: tip.id,
          amount: amountEth,
          viewer: {
            id: viewer.id,
            walletAddress: viewer.wallet_address,
            displayName: viewer.display_name,
          },
        });

        // Emit tip_event to overlay (for OBS overlay)
        logger.info(`Sending tip_event to overlay ${creator.id}`, {
          tipId: tip.id,
          amount: amountEth,
          txHash: event.txHash,
        });
        overlayWsHelpers.notifyTipEvent(creator.id, {
          tipId: tip.id,
          amount: amountEth,
          viewer: {
            displayName: viewer.display_name,
            walletAddress: viewer.wallet_address,
          },
        });
      }

      // Also emit TIP_SENT event for backward compatibility (if any clients still use it)
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
  private emitTipSentEvent(
    creatorId: string,
    payload: {
      creatorId: string;
      tipperAddress: string;
      amountEth: string;
      txHash: string;
      tipMode: string;
      timestamp: string;
    }
  ): void {
    // Send to overlay connection if exists
    const overlayConn = wsManager.getOverlayConnection(creatorId);
    if (overlayConn && overlayConn.ws.readyState === 1) {
      // WebSocket.OPEN
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

    logger.warn(
      `Blockchain provider disconnected. Reconnecting in ${delay}ms (attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts})`
    );

    this.reconnectTimeout = setTimeout(() => {
      this.start().catch(error => {
        logger.error('Reconnection failed:', error);
      });
    }, delay);
  }

  /**
   * Manually sync tips from blockchain (for a specific creator or all)
   */
  async syncTips(creatorWalletAddress?: string, fromBlock?: number, toBlock?: number): Promise<{ synced: number; errors: number }> {
    if (!this.contract || !this.provider) {
      await this.initializeProvider();
    }

    if (!this.contract || !this.provider) {
      throw new Error('Provider or contract not initialized');
    }

    const currentBlock = await this.provider.getBlockNumber();
    const startBlock = fromBlock || Math.max(0, currentBlock - 1000);
    const endBlock = toBlock || currentBlock;

    logger.info(`Manual sync: Processing TipSent events from block ${startBlock} to ${endBlock}${creatorWalletAddress ? ` for creator ${creatorWalletAddress}` : ''}`);

    const filter = creatorWalletAddress 
      ? this.contract.filters.TipSent(null, creatorWalletAddress.toLowerCase())
      : this.contract.filters.TipSent();
    
    const events = await this.contract.queryFilter(filter, startBlock, endBlock);
    
    logger.info(`Found ${events.length} TipSent events to sync`);

    let synced = 0;
    let errors = 0;

    for (const event of events) {
      // Type guard: EventLog has args, Log doesn't
      if (!('args' in event) || !event.args) continue;
      
      try {
        const [from, to, amount, sessionId] = event.args;
        await this.handleTipSentEvent({
          from: from.toLowerCase(),
          to: to.toLowerCase(),
          amount,
          sessionId,
          txHash: event.transactionHash,
          blockNumber: event.blockNumber,
        });
        synced++;
      } catch (error) {
        logger.error(`Error syncing tip ${event.transactionHash}:`, error);
        errors++;
      }
    }

    logger.info(`Sync complete: ${synced} synced, ${errors} errors`);
    return { synced, errors };
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
