import { supabaseAdmin } from '../config/db';
import { Tip, SendTipInput, TipResponse } from '../types/tip';

export const tipModel = {
  create: async (input: SendTipInput, viewerId: string, creatorId: string): Promise<Tip | null> => {
    const { data, error } = await supabaseAdmin
      .from('tips')
      .insert({
        creator_id: creatorId,
        stream_id: input.streamId || null,
        viewer_id: viewerId,
        amount_eth: input.amountEth,
        tx_hash: input.txHash,
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create tip: ${error.message}`);
    }

    return data as Tip;
  },

  findById: async (id: string): Promise<Tip | null> => {
    const { data, error } = await supabaseAdmin.from('tips').select('*').eq('id', id).single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null;
      }
      throw new Error(`Failed to find tip: ${error.message}`);
    }

    return data as Tip;
  },

  findByStreamId: async (streamId: string): Promise<Tip[]> => {
    const { data, error } = await supabaseAdmin
      .from('tips')
      .select('*')
      .eq('stream_id', streamId)
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error(`Failed to find tips: ${error.message}`);
    }

    return (data || []) as Tip[];
  },

  findByViewerId: async (viewerId: string): Promise<Tip[]> => {
    const { data, error } = await supabaseAdmin
      .from('tips')
      .select('*')
      .eq('viewer_id', viewerId)
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error(`Failed to find tips: ${error.message}`);
    }

    return (data || []) as Tip[];
  },

  findByCreatorId: async (creatorId: string): Promise<Tip[]> => {
    const { data, error } = await supabaseAdmin
      .from('tips')
      .select('*')
      .eq('creator_id', creatorId)
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error(`Failed to find tips by creator: ${error.message}`);
    }

    return (data || []) as Tip[];
  },

  findWithViewersByCreatorId: async (creatorId: string): Promise<TipResponse[]> => {
    const { data, error } = await supabaseAdmin
      .from('tips')
      .select(`
        *,
        viewer:users!tips_viewer_id_fkey (
          id,
          wallet_address,
          display_name
        )
      `)
      .eq('creator_id', creatorId)
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error(`Failed to find tips with viewers: ${error.message}`);
    }

    return (data || []) as TipResponse[];
  },

  updateTxHash: async (tipId: string, txHash: string): Promise<Tip | null> => {
    const { data, error } = await supabaseAdmin
      .from('tips')
      .update({
        tx_hash: txHash,
      })
      .eq('id', tipId)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to update tip: ${error.message}`);
    }

    return data as Tip;
  },

  createFromBlockchain: async (input: {
    creatorId: string;
    viewerId: string;
    streamId: string | null;
    amountEth: string;
    txHash: string;
    tipMode: 'live' | 'offline';
  }): Promise<Tip | null> => {
    const { data, error } = await supabaseAdmin
      .from('tips')
      .insert({
        creator_id: input.creatorId,
        stream_id: input.streamId,
        viewer_id: input.viewerId,
        amount_eth: input.amountEth,
        tx_hash: input.txHash,
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create tip from blockchain: ${error.message}`);
    }

    return data as Tip;
  },
};

