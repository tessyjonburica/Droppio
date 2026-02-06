import { Overlay, UpdateOverlayInput } from '../types/overlay';
import { overlayModel } from '../models/overlay.model';
import { userModel } from '../models/user.model';
import { overlayTokenModel } from '../models/overlay-token.model';
import crypto from 'crypto';

export const overlayService = {
  getConfig: async (creatorId: string): Promise<Overlay> => {
    // Find overlay by creator ID
    let overlay = await overlayModel.findByCreatorId(creatorId);

    // If not found, create default overlay
    if (!overlay) {
      // Validate creator exists
      const creator = await userModel.findById(creatorId);
      if (!creator) {
        throw new Error('Creator not found');
      }

      overlay = await overlayModel.create(creatorId);
      if (!overlay) {
        throw new Error('Failed to create overlay');
      }
    }

    return overlay;
  },

  updateConfig: async (creatorId: string, input: UpdateOverlayInput): Promise<Overlay> => {
    // Validate creator exists
    const creator = await userModel.findById(creatorId);
    if (!creator) {
      throw new Error('Creator not found');
    }

    // Get or create overlay
    let overlay = await overlayModel.findByCreatorId(creatorId);
    if (!overlay) {
      overlay = await overlayModel.create(creatorId);
      if (!overlay) {
        throw new Error('Failed to create overlay');
      }
    }

    // Update overlay config
    const updatedOverlay = await overlayModel.update(creatorId, input);
    if (!updatedOverlay) {
      throw new Error('Failed to update overlay config');
    }

    return updatedOverlay;
  },

  getOrCreateOverlayToken: async (creatorId: string): Promise<string> => {
    // Validate creator exists
    const creator = await userModel.findById(creatorId);
    if (!creator) {
      throw new Error('Creator not found');
    }

    // Check if token already exists
    let tokenRecord = await overlayTokenModel.findByCreatorId(creatorId);

    if (tokenRecord) {
      return tokenRecord.token;
    }

    // Generate new secure token (256-bit random token)
    const token = crypto.randomBytes(32).toString('hex');

    // Create token record
    tokenRecord = await overlayTokenModel.create(creatorId, token);

    return tokenRecord.token;
  },
};
