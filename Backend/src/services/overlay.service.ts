import { Overlay, UpdateOverlayInput } from '../types/overlay';
import { overlayModel } from '../models/overlay.model';
import { userModel } from '../models/user.model';

export const overlayService = {
  getConfig: async (streamerId: string): Promise<Overlay> => {
    // Find overlay by streamer ID
    let overlay = await overlayModel.findByStreamerId(streamerId);

    // If not found, create default overlay
    if (!overlay) {
      // Validate streamer exists
      const streamer = await userModel.findById(streamerId);
      if (!streamer) {
        throw new Error('Streamer not found');
      }

      overlay = await overlayModel.create(streamerId);
      if (!overlay) {
        throw new Error('Failed to create overlay');
      }
    }

    return overlay;
  },

  updateConfig: async (streamerId: string, input: UpdateOverlayInput): Promise<Overlay> => {
    // Validate streamer exists
    const streamer = await userModel.findById(streamerId);
    if (!streamer) {
      throw new Error('Streamer not found');
    }

    // Get or create overlay
    let overlay = await overlayModel.findByStreamerId(streamerId);
    if (!overlay) {
      overlay = await overlayModel.create(streamerId);
      if (!overlay) {
        throw new Error('Failed to create overlay');
      }
    }

    // Update overlay config
    const updatedOverlay = await overlayModel.update(streamerId, input);
    if (!updatedOverlay) {
      throw new Error('Failed to update overlay config');
    }

    return updatedOverlay;
  },
};
