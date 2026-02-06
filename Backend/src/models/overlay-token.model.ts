import { supabaseAdmin } from '../config/db';

export interface OverlayToken {
    id: string;
    creator_id: string;
    token: string;
    created_at: string;
    last_used_at: string | null;
}

export const overlayTokenModel = {
    findByToken: async (token: string): Promise<OverlayToken | null> => {
        const { data, error } = await supabaseAdmin
            .from('overlay_tokens')
            .select('*')
            .eq('token', token)
            .single();

        if (error) {
            if (error.code === 'PGRST116') {
                return null;
            }
            throw new Error(`Failed to find overlay token: ${error.message}`);
        }

        return data as OverlayToken;
    },

    findByCreatorId: async (creatorId: string): Promise<OverlayToken | null> => {
        const { data, error } = await supabaseAdmin
            .from('overlay_tokens')
            .select('*')
            .eq('creator_id', creatorId)
            .single();

        if (error) {
            if (error.code === 'PGRST116') {
                return null;
            }
            throw new Error(`Failed to find overlay token: ${error.message}`);
        }

        return data as OverlayToken;
    },

    create: async (creatorId: string, token: string): Promise<OverlayToken> => {
        const { data, error } = await supabaseAdmin
            .from('overlay_tokens')
            .insert({
                creator_id: creatorId,
                token,
            })
            .select()
            .single();

        if (error) {
            throw new Error(`Failed to create overlay token: ${error.message}`);
        }

        return data as OverlayToken;
    },

    updateLastUsed: async (token: string): Promise<void> => {
        const { error } = await supabaseAdmin
            .from('overlay_tokens')
            .update({ last_used_at: new Date().toISOString() })
            .eq('token', token);

        if (error) {
            throw new Error(`Failed to update last_used_at: ${error.message}`);
        }
    },

    delete: async (creatorId: string): Promise<void> => {
        const { error } = await supabaseAdmin
            .from('overlay_tokens')
            .delete()
            .eq('creator_id', creatorId);

        if (error) {
            throw new Error(`Failed to delete overlay token: ${error.message}`);
        }
    },
};
