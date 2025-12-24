import { api } from './api';

export interface OnboardUserInput {
  walletAddress: string;
  role: 'viewer' | 'creator';
  displayName?: string;
  avatarUrl?: string;
  platform?: 'twitch' | 'youtube' | 'kick' | 'tiktok';
  payoutWallet?: string;
}

export interface User {
  id: string;
  wallet_address: string;
  role: 'viewer' | 'creator';
  display_name: string | null;
  avatar_url: string | null;
  bio: string | null;
  platform: 'twitch' | 'youtube' | 'kick' | 'tiktok' | null;
  payout_wallet: string | null;
  created_at: string;
  updated_at: string;
}

export interface UpdateProfileInput {
  displayName?: string;
  avatarUrl?: string;
  bio?: string;
  platform?: 'twitch' | 'youtube' | 'kick' | 'tiktok';
  payoutWallet?: string;
}

export const userService = {
  async onboard(data: OnboardUserInput): Promise<User> {
    const response = await api.post<User>('/users/onboard', data);
    return response.data;
  },

  async getMe(): Promise<User> {
    const response = await api.get<{ user: User }>('/users/me');
    return response.data.user;
  },

  async updateProfile(data: UpdateProfileInput): Promise<User> {
    const response = await api.patch<{ user: User }>('/users/me', data);
    return response.data.user;
  },
};
