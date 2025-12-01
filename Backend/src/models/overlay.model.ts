import { supabase } from '../config/db';
import { Overlay, UpdateOverlayInput } from '../types/overlay';

export const overlayModel = {
  findByStreamerId: async (streamerId: string): Promise<Overlay | null> => {
    const { data, error } = await supabase
      .from('overlays')
      .select('*')
      .eq('streamer_id', streamerId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null;
      }
      throw new Error(`Failed to find overlay: ${error.message}`);
    }

    return data as Overlay;
  },

  create: async (streamerId: string): Promise<Overlay | null> => {
    const defaultOverlay = {
      streamer_id: streamerId,
      theme: {},
      alert_settings: {
        enabled: true,
        soundEnabled: false,
        minAmount: '0',
        showDuration: 5000,
      },
    };

    const { data, error } = await supabase
      .from('overlays')
      .insert(defaultOverlay)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create overlay: ${error.message}`);
    }

    return data as Overlay;
  },

  update: async (streamerId: string, input: UpdateOverlayInput): Promise<Overlay | null> => {
    const updateData: Record<string, unknown> = {};

    if (input.theme !== undefined) {
      updateData.theme = input.theme;
    }

    if (input.alertSettings !== undefined) {
      updateData.alert_settings = input.alertSettings;
    }

    const { data, error } = await supabase
      .from('overlays')
      .update(updateData)
      .eq('streamer_id', streamerId)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to update overlay: ${error.message}`);
    }

    return data as Overlay;
  },
};
