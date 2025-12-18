import { SendTipInput, TipResponse } from '../types/tip';
import { tipModel } from '../models/tip.model';
import { verifyWalletSignature } from '../utils/signature';
import { verifyUSDCTransaction } from '../utils/blockchain';
import { streamModel } from '../models/stream.model';
import { userModel } from '../models/user.model';
import { streamerWsHelpers } from '../websockets/streamer.ws';
import { overlayWsHelpers } from '../websockets/overlay.ws';

export const tipService = {
  sendTip: async (walletAddress: string, input: SendTipInput): Promise<TipResponse> => {
    // Verify wallet signature matches viewer
    const verification = await verifyWalletSignature(
      input.message,
      input.signature,
      walletAddress
    );

    if (!verification.isValid) {
      throw new Error('Invalid wallet signature');
    }

    // Validate amount > 0
    const amount = parseFloat(input.amountUsdc);
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

    // Verify transaction hash with ethers provider
    const isValidTx = await verifyUSDCTransaction(
      input.txHash,
      input.amountUsdc,
      walletAddress
    );

    if (!isValidTx) {
      throw new Error('Transaction verification failed');
    }

    // Get creator to validate they exist
    const creator = await userModel.findById(creatorId);
    if (!creator) {
      throw new Error('Creator not found');
    }

    // Create tip record in DB
    const tip = await tipModel.create(input, viewer.id, creatorId);
    if (!tip) {
      throw new Error('Failed to create tip');
    }

    // Always emit WebSocket event to streamer dashboard (regardless of live status)
    streamerWsHelpers.notifyTipReceived(creatorId, {
      tipId: tip.id,
      amount: tip.amount_usdc,
      viewer: {
        id: viewer.id,
        walletAddress: viewer.wallet_address,
        displayName: viewer.display_name,
      },
    });

    // Only emit WebSocket event to overlay if stream exists AND is live
    if (stream && stream.is_live) {
      overlayWsHelpers.notifyTipEvent(creatorId, {
        tipId: tip.id,
        amount: tip.amount_usdc,
        viewer: {
          displayName: viewer.display_name,
          walletAddress: viewer.wallet_address,
        },
      });
    }

    return {
      ...tip,
      viewer: {
        id: viewer.id,
        wallet_address: viewer.wallet_address,
        display_name: viewer.display_name,
      },
    };
  },

  verifyTransaction: async (txHash: string, expectedAmount: string, fromAddress: string): Promise<boolean> => {
    // Verify transaction using blockchain utilities
    return verifyUSDCTransaction(txHash, expectedAmount, fromAddress);
  },
};
