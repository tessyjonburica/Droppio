import { SendTipInput, TipResponse } from '../types/tip';
import { tipModel } from '../models/tip.model';
import { verifyWalletSignature } from '../utils/signature';
import { verifyETHTransaction } from '../utils/blockchain';
import { streamModel } from '../models/stream.model';
import { userModel } from '../models/user.model';
import { logger } from '../utils/logger';
import { env } from '../config/env';

export const tipService = {
  sendTip: async (walletAddress: string, input: SendTipInput): Promise<TipResponse> => {
    // Verify wallet signature matches viewer (optional if already authenticated via JWT)
    if (input.signature && input.message) {
      const verification = await verifyWalletSignature(input.message, input.signature, walletAddress);
      if (!verification.isValid) {
        throw new Error('Invalid wallet signature');
      }
    }

    // Validate amount > 0
    const amount = parseFloat(input.amountEth);
    if (isNaN(amount) || amount <= 0) {
      throw new Error('Invalid tip amount');
    }

    // Validate: either streamId OR creatorId must be provided
    if (!input.streamId && !input.creatorId) {
      throw new Error('Either streamId or creatorId must be provided');
    }

    if (input.streamId && input.creatorId) {
      throw new Error('Cannot provide both streamId and creatorId');
    }

    let stream = null;
    let creatorId: string;

    // If streamId provided, validate stream exists (but don't require it to be live)
    if (input.streamId) {
      stream = await streamModel.findById(input.streamId);
      if (!stream) {
        throw new Error('Stream not found');
      }
      creatorId = stream.streamer_id;
    } else {
      // If no streamId, creatorId must be provided for offline tip
      if (!input.creatorId) {
        throw new Error('creatorId is required for offline tips');
      }
      creatorId = input.creatorId;
    }

    // Get viewer user
    const viewer = await userModel.findByWalletAddress(walletAddress);
    if (!viewer) {
      throw new Error('Viewer not found');
    }

    // Get creator user (needed for wallet address verification)
    const creator = await userModel.findById(creatorId);
    if (!creator) {
      throw new Error('Creator not found');
    }

    let isValidTx = false;
    logger.info(`[TipService] Verifying transaction: ${input.txHash} for ${input.amountEth} ETH to ${creator.wallet_address}`);

    if (env.SKIP_BLOCKCHAIN_VERIFICATION || (process.env.NODE_ENV === 'development' && input.txHash.startsWith('0x0000'))) {
      logger.info('   - Bypassing blockchain verification (Development Mode)');
      isValidTx = true;
    } else {
      isValidTx = await verifyETHTransaction(input.txHash, input.amountEth, walletAddress, creator.wallet_address);
    }

    if (!isValidTx) {
      logger.error(`[TipService] Transaction verification failed for hash: ${input.txHash}`);
      throw new Error('Transaction verification failed');
    }
    logger.info('[TipService] Transaction verified');

    // Prevention: Creators cannot tip themselves
    if (walletAddress.toLowerCase() === creator.wallet_address.toLowerCase()) {
      logger.warn(`[TipService] Self-tipping attempted by wallet: ${walletAddress}`);
      throw new Error('You cannot tip yourself');
    }

    // Create tip record in DB
    logger.info(`[TipService] Creating tip record in DB for creator: ${creatorId}`);
    const tip = await tipModel.create(input, viewer.id, creatorId);
    if (!tip) {
      logger.error(`[TipService] Failed to create tip record for creator ${creatorId}`);
      throw new Error('Failed to create tip');
    }
    logger.info(`[TipService] Tip created successfully: ${tip.id}`);
    logger.info(`[TipService] Tip recorded. Waiting for BlockchainListener to acknowledge and broadcast.`);

    return {
      ...tip,
      viewer: {
        id: viewer.id,
        wallet_address: viewer.wallet_address,
        display_name: viewer.display_name,
      },
    };
  },

  verifyTransaction: async (
    txHash: string,
    expectedAmount: string,
    fromAddress: string,
    expectedToAddress: string
  ): Promise<boolean> => {
  

    return verifyETHTransaction(txHash, expectedAmount, fromAddress, expectedToAddress);
  },
};
