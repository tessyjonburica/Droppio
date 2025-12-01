import { z } from 'zod';

export const UserRoleSchema = z.enum(['viewer', 'streamer']);
export type UserRole = z.infer<typeof UserRoleSchema>;

export const PlatformSchema = z.enum(['twitch', 'youtube', 'kick', 'tiktok']);
export type Platform = z.infer<typeof PlatformSchema>;

export interface User {
  id: string;
  wallet_address: string;
  role: UserRole;
  display_name: string | null;
  avatar_url: string | null;
  platform: Platform | null;
  payout_wallet: string | null;
  created_at: Date;
  updated_at: Date;
}

export interface CreateUserInput {
  walletAddress: string;
  role: UserRole;
}

export interface OnboardUserInput {
  walletAddress: string;
  role: UserRole;
  displayName?: string;
  avatarUrl?: string;
  platform?: Platform;
  payoutWallet?: string;
}

export interface UpdateStreamerProfileInput {
  displayName?: string;
  avatarUrl?: string;
  platform?: Platform;
  payoutWallet?: string;
}
