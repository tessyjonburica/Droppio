import { api } from './api';

export interface CreatorProfile {
  id: string;
  wallet_address: string;
  display_name: string | null;
  avatar_url: string | null;
  platform: 'twitch' | 'youtube' | 'kick' | 'tiktok' | null;
  payout_wallet: string | null;
}

export const creatorService = {
  async getByUsername(username: string): Promise<CreatorProfile> {
    // TODO: Backend needs to implement this endpoint
    // For now, we'll need to search by display_name or wallet address
    // This is a placeholder - backend should have GET /users/by-username/:username
    const response = await api.get<CreatorProfile>(`/users/by-username/${username}`);
    return response.data;
  },

  async getById(id: string): Promise<CreatorProfile> {
    // This would be used if we have the creator ID
    const response = await api.get<CreatorProfile>(`/users/${id}`);
    return response.data;
  },
};

