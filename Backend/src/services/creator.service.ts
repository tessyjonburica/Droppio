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
        creator =
          creators.find(c => c.display_name?.toLowerCase() === username.toLowerCase()) ||
          creators[0];
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
      allCreators.map(async creator => {
        const tips = await tipModel.findByCreatorId(creator.id);
        const totalTips = tips.reduce((sum, tip) => {
          return sum + parseFloat(tip.amount_eth || '0');
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

  getTotalTips: async (
    creatorId: string
  ): Promise<{ totalTips: string; totalTipsCount: number }> => {
    const tips = await tipModel.findByCreatorId(creatorId);
    const totalTips = tips.reduce((sum, tip) => {
      return sum + parseFloat(tip.amount_eth || '0');
    }, 0);

    return {
      totalTips: totalTips.toFixed(6),
      totalTipsCount: tips.length,
    };
  },

  getTipsByCreator: async (creatorId: string): Promise<any[]> => {
    // Validate creatorId
    if (!creatorId || typeof creatorId !== 'string') {
      throw new Error('Invalid creator ID');
    }

    try {
      // Try to use the efficient JOIN query first
      try {
        const tipsWithViewers = await tipModel.findWithViewersByCreatorId(creatorId);
        // TipResponse already has the viewer property in the correct format
        return tipsWithViewers.map(tip => ({
          ...tip,
          viewer: tip.viewer || null, // Ensure viewer is null if undefined
        }));
      } catch (joinError) {
        // If JOIN query fails (e.g., foreign key issues), fall back to manual method
        console.warn(`JOIN query failed, falling back to manual method:`, joinError);
        
        // Get all tips for this creator
        const tips = await tipModel.findByCreatorId(creatorId);

        // If no tips, return empty array
        if (!tips || tips.length === 0) {
          return [];
        }

        // Enrich each tip with viewer information
        // Handle null viewer_id and missing viewers gracefully
        // Use Promise.allSettled to ensure one failure doesn't break all tips
        const tipsWithViewers = await Promise.allSettled(
          tips.map(async tip => {
            // Skip viewer lookup if viewer_id is null or undefined
            if (!tip.viewer_id) {
              return {
                ...tip,
                viewer: null,
              };
            }

            try {
              const viewer = await userModel.findById(tip.viewer_id);
              return {
                ...tip,
                viewer: viewer
                  ? {
                      id: viewer.id,
                      wallet_address: viewer.wallet_address,
                      display_name: viewer.display_name,
                    }
                  : null,
              };
            } catch (viewerError) {
              // Log error but don't fail the entire request
              // Return tip without viewer info if lookup fails
              const errorMsg = viewerError instanceof Error ? viewerError.message : 'Unknown error';
              console.error(`Failed to fetch viewer ${tip.viewer_id} for tip ${tip.id}:`, errorMsg);
              return {
                ...tip,
                viewer: null,
              };
            }
          })
        );

        // Extract successful results, handle rejected promises gracefully
        return tipsWithViewers
          .map((result, index) => {
            if (result.status === 'fulfilled') {
              return result.value;
            } else {
              // If a tip failed to process, return it without viewer info
              const errorMsg = result.reason instanceof Error ? result.reason.message : 'Unknown error';
              console.error(`Failed to process tip at index ${index}:`, errorMsg);
              const tip = tips[index];
              return {
                ...tip,
                viewer: null,
              };
            }
          })
          .filter(Boolean); // Remove any null/undefined entries
      }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Unknown error';
      const errorStack = error instanceof Error ? error.stack : undefined;
      console.error(`Failed to get tips for creator ${creatorId}:`, errorMsg, errorStack);
      // Re-throw with more context
      throw new Error(`Failed to fetch tips: ${errorMsg}`);
    }
  },
};
