export interface Tip {
  id: string;
  creator_id?: string;
  stream_id: string | null;
  viewer_id: string;
  amount_eth: string; // Numeric as string
  tx_hash: string | null;
  created_at: Date;
}

export interface SendTipInput {
  streamId?: string; // Optional - if provided, tip is associated with stream
  creatorId?: string; // Optional - if provided, tip is offline (no stream)
  amountEth: string;
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
