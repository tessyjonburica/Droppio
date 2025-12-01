import { supabase } from '../config/db';
import { User, CreateUserInput, OnboardUserInput, UpdateStreamerProfileInput } from '../types/user';

export const userModel = {
  create: async (input: CreateUserInput): Promise<User | null> => {
    const { data, error } = await supabase
      .from('users')
      .insert({
        wallet_address: input.walletAddress.toLowerCase(),
        role: input.role,
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create user: ${error.message}`);
    }

    return data as User;
  },

  findByWalletAddress: async (walletAddress: string): Promise<User | null> => {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('wallet_address', walletAddress.toLowerCase())
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null;
      }
      throw new Error(`Failed to find user: ${error.message}`);
    }

    return data as User;
  },

  findById: async (id: string): Promise<User | null> => {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null;
      }
      throw new Error(`Failed to find user: ${error.message}`);
    }

    return data as User;
  },

  onboard: async (input: OnboardUserInput): Promise<User | null> => {
    const existingUser = await userModel.findByWalletAddress(input.walletAddress);

    if (existingUser) {
      // Update existing user
      const updateData: Record<string, unknown> = {};
      if (input.role) updateData.role = input.role;
      if (input.displayName !== undefined) updateData.display_name = input.displayName;
      if (input.avatarUrl !== undefined) updateData.avatar_url = input.avatarUrl;
      if (input.platform !== undefined) updateData.platform = input.platform;
      if (input.payoutWallet !== undefined) updateData.payout_wallet = input.payoutWallet?.toLowerCase();

      const { data, error } = await supabase
        .from('users')
        .update(updateData)
        .eq('wallet_address', input.walletAddress.toLowerCase())
        .select()
        .single();

      if (error) {
        throw new Error(`Failed to update user: ${error.message}`);
      }

      return data as User;
    }

    // Create new user
    const { data, error } = await supabase
      .from('users')
      .insert({
        wallet_address: input.walletAddress.toLowerCase(),
        role: input.role,
        display_name: input.displayName || null,
        avatar_url: input.avatarUrl || null,
        platform: input.platform || null,
        payout_wallet: input.payoutWallet?.toLowerCase() || null,
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to onboard user: ${error.message}`);
    }

    return data as User;
  },

  updateStreamerProfile: async (
    walletAddress: string,
    input: UpdateStreamerProfileInput
  ): Promise<User | null> => {
    const updateData: Record<string, unknown> = {};
    if (input.displayName !== undefined) updateData.display_name = input.displayName;
    if (input.avatarUrl !== undefined) updateData.avatar_url = input.avatarUrl;
    if (input.platform !== undefined) updateData.platform = input.platform;
    if (input.payoutWallet !== undefined) {
      updateData.payout_wallet = input.payoutWallet ? input.payoutWallet.toLowerCase() : null;
    }

    const { data, error } = await supabase
      .from('users')
      .update(updateData)
      .eq('wallet_address', walletAddress.toLowerCase())
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to update streamer profile: ${error.message}`);
    }

    return data as User;
  },
};
