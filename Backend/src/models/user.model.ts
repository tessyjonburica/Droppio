import { supabase, supabaseAdmin } from '../config/db';
import { User, CreateUserInput, OnboardUserInput, UpdateStreamerProfileInput } from '../types/user';

export const userModel = {
  create: async (input: CreateUserInput): Promise<User | null> => {
    const { data, error } = await supabaseAdmin
      .from('users')
      .insert({
        wallet_address: input.walletAddress.toLowerCase(),
        role: input.role,
      })
      .select()
      .single();

    if (error) {
      // Enhanced error message for permission issues
      if (error.message?.includes('permission denied') || error.code === '42501') {
        throw new Error(
          `Database permission denied. Please check:\n` +
          `1. SUPABASE_SERVICE_ROLE_KEY is set correctly in .env\n` +
          `2. Run migration: 000_FRESH_START.sql in Supabase SQL Editor\n` +
          `3. Verify the users table exists and role constraint allows '${input.role}'\n` +
          `Original error: ${error.message}`
        );
      }
      
      // Check for constraint violation (wrong role value)
      if (error.message?.includes('check constraint') || error.code === '23514') {
        throw new Error(
          `Invalid role value: '${input.role}'. Allowed values: 'viewer', 'creator', 'admin'. ` +
          `Please run migration: 002_fix_rls_and_roles.sql`
        );
      }
      
      throw new Error(`Failed to create user: ${error.message} (code: ${error.code})`);
    }

    return data as User;
  },

  findByWalletAddress: async (walletAddress: string): Promise<User | null> => {
    const { data, error } = await supabaseAdmin
      .from('users')
      .select('*')
      .eq('wallet_address', walletAddress.toLowerCase())
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        // No rows returned - user doesn't exist
        return null;
      }
      
      // Enhanced error message for permission issues
      if (error.message?.includes('permission denied') || error.code === '42501') {
        throw new Error(
          `Database permission denied. Please check:\n` +
          `1. SUPABASE_SERVICE_ROLE_KEY is set correctly in .env\n` +
          `2. Run migration: 000_FRESH_START.sql in Supabase SQL Editor\n` +
          `3. Verify the users table exists\n` +
          `Original error: ${error.message}`
        );
      }
      
      throw new Error(`Failed to find user: ${error.message} (code: ${error.code})`);
    }

    return data as User;
  },

  findById: async (id: string): Promise<User | null> => {
    const { data, error } = await supabaseAdmin
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

      const { data, error } = await supabaseAdmin
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
    const { data, error } = await supabaseAdmin
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
    if (input.bio !== undefined) updateData.bio = input.bio;
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

  findByDisplayName: async (displayName: string): Promise<User | null> => {
    const { data, error } = await supabaseAdmin
      .from('users')
      .select('*')
      .ilike('display_name', displayName)
      .eq('role', 'creator')
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null;
      }
      throw new Error(`Failed to find user by display name: ${error.message}`);
    }

    return data as User;
  },

  searchCreators: async (query: string): Promise<User[]> => {
    // If empty query, return all creators
    if (!query || query.trim().length === 0) {
      const { data, error } = await supabaseAdmin
        .from('users')
        .select('*')
        .eq('role', 'creator')
        .limit(100);

      if (error) {
        throw new Error(`Failed to search creators: ${error.message}`);
      }

      return (data || []) as User[];
    }

    const searchTerm = `%${query}%`;
    const { data, error } = await supabaseAdmin
      .from('users')
      .select('*')
      .eq('role', 'creator')
      .or(`display_name.ilike.${searchTerm},wallet_address.ilike.${searchTerm}`)
      .limit(20);

    if (error) {
      throw new Error(`Failed to search creators: ${error.message}`);
    }

    return (data || []) as User[];
  },
};
