import { User } from '../types/user';
import { userModel } from '../models/user.model';
import { tipModel } from '../models/tip.model';

export interface CreatorProfile extends User {
  total_tips?: string;
  total_tips_count?: number;
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
  getByUsername: async (username: string): Promise<CreatorProfile> => {
    // Try exact match first (case-insensitive)
    let creator = await userModel.findByDisplayName(username);
    
    // If not found, try partial match
    if (!creator) {
      const creators = await userModel.searchCreators(username);
      if (creators.length > 0) {
        // Find best match (exact case-insensitive or first result)
        creator = creators.find(c => c.display_name?.toLowerCase() === username.toLowerCase()) || creators[0];
      }
    }

    if (!creator || creator.role !== 'creator') {
      throw new Error('Creator not found');
    }

    return creator as CreatorProfile;
  },

  searchCreators: async (query: string): Promise<CreatorProfile[]> => {
    const creators = await userModel.searchCreators(query);
    return creators as CreatorProfile[];
  },

  getFeaturedCreators: async (limit: number = 10): Promise<FeaturedCreator[]> => {
    // Get all creators (search with empty string to get all)
    const allCreators = await userModel.searchCreators('');
    
    // If no creators, return empty array
    if (allCreators.length === 0) {
      return [];
    }
    
    // Calculate total tips for each creator
    const creatorsWithTips = await Promise.all(
      allCreators.map(async (creator) => {
        const tips = await tipModel.findByCreatorId(creator.id);
        const totalTips = tips.reduce((sum, tip) => {
          return sum + parseFloat(tip.amount_usdc || '0');
        }, 0);
        
        return {
          id: creator.id,
          display_name: creator.display_name,
          avatar_url: creator.avatar_url,
          platform: creator.platform,
          wallet_address: creator.wallet_address,
          total_tips: totalTips.toFixed(6),
          total_tips_count: tips.length,
        };
      })
    );

    // Sort by total tips descending and limit
    return creatorsWithTips
      .sort((a, b) => parseFloat(b.total_tips) - parseFloat(a.total_tips))
      .slice(0, limit);
  },

  getTotalTips: async (creatorId: string): Promise<{ totalTips: string; totalTipsCount: number }> => {
    const tips = await tipModel.findByCreatorId(creatorId);
    const totalTips = tips.reduce((sum, tip) => {
      return sum + parseFloat(tip.amount_usdc || '0');
    }, 0);

    return {
      totalTips: totalTips.toFixed(6),
      totalTipsCount: tips.length,
    };
  },
};
