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

    // Check stream exists and is live
    const stream = await streamModel.findById(input.streamId);
    if (!stream) {
      throw new Error('Stream not found');
    }

    if (!stream.is_live) {
      throw new Error('Stream is not live');
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

    // Create tip record in DB
    const tip = await tipModel.create(input, viewer.id);
    if (!tip) {
      throw new Error('Failed to create tip');
    }

    // Get streamer for notifications
    const streamer = await userModel.findById(stream.streamer_id);
    if (!streamer) {
      throw new Error('Streamer not found');
    }

    // Emit WebSocket event to streamer
    streamerWsHelpers.notifyTipReceived(stream.streamer_id, {
      tipId: tip.id,
      amount: tip.amount_usdc,
      viewer: {
        id: viewer.id,
        walletAddress: viewer.wallet_address,
        displayName: viewer.display_name,
      },
    });

    // Emit WebSocket event to overlay
    overlayWsHelpers.notifyTipEvent(stream.streamer_id, {
      tipId: tip.id,
      amount: tip.amount_usdc,
      viewer: {
        displayName: viewer.display_name,
        walletAddress: viewer.wallet_address,
      },
    });

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
