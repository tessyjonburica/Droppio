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
  type: 'tip_event';
  data: TipData;
}

export interface UseOverlayWebSocketOptions {
  creatorId: string;
  token: string;
  onMessage?: (event: OverlayChannelEvent) => void;
  enabled?: boolean;
}