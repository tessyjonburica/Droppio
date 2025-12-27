import { supabase } from '../config/db';
import { Stream, StartStreamInput } from '../types/stream';

export const streamModel = {
  create: async (streamerId: string, input: StartStreamInput): Promise<Stream | null> => {
    const { data, error } = await supabase
      .from('streams')
      .insert({
        creator_id: streamerId,
        platform: input.platform,
        stream_key: input.streamKey,
        is_live: true,
      })
      .select('*, streamer_id:creator_id')
      .single();

    if (error) {
      throw new Error(`Failed to create stream: ${error.message}`);
    }

    return data as Stream;
  },

  findById: async (id: string): Promise<Stream | null> => {
    const { data, error } = await supabase
      .from('streams')
      .select('*, streamer_id:creator_id')
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null;
      }
      throw new Error(`Failed to find stream: ${error.message}`);
    }

    return data as Stream;
  },

  findByStreamerId: async (streamerId: string): Promise<Stream | null> => {
    const { data, error } = await supabase
      .from('streams')
      .select('*, streamer_id:creator_id')
      .eq('creator_id', streamerId)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null;
      }
      throw new Error(`Failed to find stream: ${error.message}`);
    }

    return data as Stream;
  },

  findActiveByStreamerId: async (streamerId: string): Promise<Stream | null> => {
    const { data, error } = await supabase
      .from('streams')
      .select('*, streamer_id:creator_id')
      .eq('creator_id', streamerId)
      .eq('is_live', true)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null;
      }
      throw new Error(`Failed to find active stream: ${error.message}`);
    }

    return data as Stream;
  },

  findActiveByCreatorId: async (creatorId: string): Promise<Stream | null> => {
    // Schema uses creator_id, but model interface uses streamer_id
    // Map creator_id to streamer_id for compatibility
    const { data, error } = await supabase
      .from('streams')
      .select('*, streamer_id:creator_id')
      .eq('creator_id', creatorId)
      .eq('is_live', true)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null;
      }
      throw new Error(`Failed to find active stream: ${error.message}`);
    }

    return data as Stream;
  },

  endStream: async (streamId: string): Promise<Stream | null> => {
    const { data, error } = await supabase
      .from('streams')
      .update({
        is_live: false,
        ended_at: new Date().toISOString(),
      })
      .eq('id', streamId)
      .select('*, streamer_id:creator_id')
      .single();

    if (error) {
      throw new Error(`Failed to end stream: ${error.message}`);
    }

    return data as Stream;
  },

  updateLiveStatus: async (streamId: string, isLive: boolean): Promise<Stream | null> => {
    const updateData: Record<string, unknown> = {
      is_live: isLive,
    };

    if (!isLive) {
      updateData.ended_at = new Date().toISOString();
    }

    const { data, error } = await supabase
      .from('streams')
      .update(updateData)
      .eq('id', streamId)
      .select('*, streamer_id:creator_id')
      .single();

    if (error) {
      throw new Error(`Failed to update stream status: ${error.message}`);
    }

    return data as Stream;
  },
};
