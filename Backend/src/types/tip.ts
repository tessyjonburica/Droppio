import { z } from 'zod';

export interface Tip {
  id: string;
  stream_id: string;
  viewer_id: string;
  amount_usdc: string; // Numeric as string
  tx_hash: string | null;
  created_at: Date;
}

export interface SendTipInput {
  streamId: string;
  amountUsdc: string;
  signature: string;
  message: string;
  txHash: string;
}

export interface TipResponse extends Tip {
  viewer?: {
    id: string;
    wallet_address: string;
    display_name: string | null;
  };
}
