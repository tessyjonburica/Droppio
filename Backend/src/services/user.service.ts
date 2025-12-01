import { OnboardUserInput, UpdateStreamerProfileInput, User } from '../types/user';
import { userModel } from '../models/user.model';

export const userService = {
  onboard: async (walletAddress: string, input: OnboardUserInput): Promise<User> => {
    // Validate wallet address matches authenticated user
    if (input.walletAddress.toLowerCase() !== walletAddress.toLowerCase()) {
      throw new Error('Wallet address mismatch');
    }

    // Check if user already onboarded
    const existingUser = await userModel.findByWalletAddress(walletAddress);

    if (existingUser) {
      // Update existing user
      const user = await userModel.onboard(input);
      if (!user) {
        throw new Error('Failed to update user profile');
      }
      return user;
    }

    // Create new user
    const user = await userModel.onboard(input);
    if (!user) {
      throw new Error('Failed to create user profile');
    }

    return user;
  },

  updateStreamerProfile: async (
    walletAddress: string,
    input: UpdateStreamerProfileInput
  ): Promise<User> => {
    // Validate user exists and is a streamer
    const user = await userModel.findByWalletAddress(walletAddress);
    if (!user) {
      throw new Error('User not found');
    }

    if (user.role !== 'streamer') {
      throw new Error('User is not a streamer');
    }

    // Update profile
    const updatedUser = await userModel.updateStreamerProfile(walletAddress, input);
    if (!updatedUser) {
      throw new Error('Failed to update streamer profile');
    }

    return updatedUser;
  },

  getProfile: async (walletAddress: string): Promise<User> => {
    // Find user by wallet address
    const user = await userModel.findByWalletAddress(walletAddress);
    if (!user) {
      throw new Error('User not found');
    }

    return user;
  },
};
