import { supabase } from '../config/db';
import { Tip, SendTipInput } from '../types/tip';

export const tipModel = {
  create: async (input: SendTipInput, viewerId: string): Promise<Tip | null> => {
    const { data, error } = await supabase
      .from('tips')
      .insert({
        stream_id: input.streamId,
        viewer_id: viewerId,
        amount_usdc: input.amountUsdc,
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
    const { data, error } = await supabase
      .from('tips')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null;
      }
      throw new Error(`Failed to find tip: ${error.message}`);
    }

    return data as Tip;
  },

  findByStreamId: async (streamId: string): Promise<Tip[]> => {
    const { data, error } = await supabase
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
    const { data, error } = await supabase
      .from('tips')
      .select('*')
      .eq('viewer_id', viewerId)
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error(`Failed to find tips: ${error.message}`);
    }

    return (data || []) as Tip[];
  },

  updateTxHash: async (tipId: string, txHash: string): Promise<Tip | null> => {
    const { data, error } = await supabase
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
    // Store ETH amount directly (schema uses amount_usdc but we'll store ETH value)
    // In production, convert ETH to USDC using exchange rate
    const amountUsdc = input.amountEth;

    // Schema uses creator_id, but Tip interface uses stream_id
    // We need to insert creator_id for the foreign key relationship
    const { data, error } = await supabase
      .from('tips')
      .insert({
        creator_id: input.creatorId,
        stream_id: input.streamId,
        viewer_id: input.viewerId,
        amount_usdc: amountUsdc,
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
