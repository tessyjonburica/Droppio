export type OverlayTheme = 'default' | 'neon' | 'minimal' | 'gaming';

export interface TipData {
  tipId: string;
  amount: string;
  viewer: {
    displayName: string | null;
    walletAddress: string;
  };
  timestamp: string;
}

export interface OverlayChannelEvent {
  type: 'tip_event' | 'TIP_SENT';
  data?: TipData;
  // TIP_SENT event structure (from blockchain listener)
  tipId?: string;
  creatorId?: string;
  tipperAddress?: string;
  amountEth?: string;
  amount?: string;
  txHash?: string;
  tipMode?: 'live' | 'offline';
  timestamp?: string;
  viewer?: {
    displayName: string | null;
    walletAddress: string;
  };
}

export interface UseOverlayWebSocketOptions {
  creatorId: string;
  token: string;
  onMessage?: (event: OverlayChannelEvent) => void;
  enabled?: boolean;
}