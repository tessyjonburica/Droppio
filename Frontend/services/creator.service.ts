import { api } from './api';

export interface CreatorProfile {
  id: string;
  wallet_address: string;
  display_name: string | null;
  avatar_url: string | null;
  bio: string | null;
  platform: 'twitch' | 'youtube' | 'kick' | 'tiktok' | null;
  payout_wallet: string | null;
}

export interface FeaturedCreator {
  id: string;
  display_name: string | null;
  avatar_url: string | null;
  platform: string | null;
  wallet_address: string;
  total_tips: string;
  total_tips_count: number;
}

export const creatorService = {
  async getByUsername(username: string): Promise<CreatorProfile> {
    const response = await api.get<{ creator: CreatorProfile }>(`/creators/by-username/${username}`);
    return response.data.creator;
  },

  async getById(id: string): Promise<CreatorProfile> {
    const response = await api.get<CreatorProfile>(`/users/${id}`);
    return response.data;
  },

  async searchCreators(query: string): Promise<CreatorProfile[]> {
    const response = await api.get<{ creators: CreatorProfile[] }>(`/creators/search?q=${encodeURIComponent(query)}`);
    return response.data.creators;
  },

  async getFeaturedCreators(limit: number = 10): Promise<FeaturedCreator[]> {
    const response = await api.get<{ creators: FeaturedCreator[] }>(`/creators/featured?limit=${limit}`);
    return response.data.creators;
  },

  async getTotalTips(creatorId: string): Promise<{ totalTips: string; totalTipsCount: number }> {
    const response = await api.get<{ totalTips: string; totalTipsCount: number }>(`/creators/${creatorId}/total-tips`);
    return response.data;
  },
};

