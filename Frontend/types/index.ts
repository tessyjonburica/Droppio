export type UserRole = 'viewer' | 'creator';
export type Platform = 'twitch' | 'youtube' | 'kick' | 'tiktok';

export interface User {
  id: string;
  wallet_address: string;
  role: UserRole;
  display_name: string | null;
  avatar_url: string | null;
  platform: Platform | null;
  payout_wallet: string | null;
  created_at: string;
  updated_at: string;
}

export interface Stream {
  id: string;
  streamer_id: string;
  platform: Platform;
  stream_key: string;
  is_live: boolean;
  created_at: string;
  ended_at: string | null;
}

export interface Tip {
  id: string;
  stream_id: string;
  viewer_id: string;
  amount_usdc: string;
  tx_hash: string | null;
  created_at: string;
}

export interface Overlay {
  id: string;
  streamer_id: string;
  theme: Record<string, any>;
  alert_settings: Record<string, any>;
  created_at: string;
  updated_at: string;
}

