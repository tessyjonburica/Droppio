import { Stream, StartStreamInput, StreamResponse } from '../types/stream';
import { streamModel } from '../models/stream.model';
import { userModel } from '../models/user.model';
import { streamerWsHelpers } from '../websockets/streamer.ws';
import { viewerWsHelpers } from '../websockets/viewer.ws';

export const streamService = {
  startStream: async (streamerId: string, input: StartStreamInput): Promise<Stream> => {
    // Validate creator exists and is a creator
    const streamer = await userModel.findById(streamerId);
    if (!streamer) {
      throw new Error('Streamer not found');
    }

    if (streamer.role !== 'creator') {
      throw new Error('User is not a streamer');
    }

    // Check if creator already has an active stream
    const activeStream = await streamModel.findActiveByStreamerId(streamerId);
    if (activeStream) {
      throw new Error('Creator already has an active stream');
    }

    // Create new stream
    const stream = await streamModel.create(streamerId, input);
    if (!stream) {
      throw new Error('Failed to create stream');
    }

    // Emit WebSocket event to viewers with streamer info
    viewerWsHelpers.broadcastStreamStarted(stream, streamer);

    return stream;
  },

  endStream: async (streamId: string, streamerId: string): Promise<Stream> => {
    // Validate stream exists
    const stream = await streamModel.findById(streamId);
    if (!stream) {
      throw new Error('Stream not found');
    }

    // Validate stream belongs to creator
    if (stream.streamer_id !== streamerId) {
      throw new Error('Stream does not belong to this creator');
    }

    // End stream
    const endedStream = await streamModel.endStream(streamId);
    if (!endedStream) {
      throw new Error('Failed to end stream');
    }

    // Emit WebSocket event to viewers
    viewerWsHelpers.broadcastStreamEnded(streamId);

    return endedStream;
  },

  getStream: async (streamId: string): Promise<StreamResponse> => {
    // Find stream by ID
    const stream = await streamModel.findById(streamId);
    if (!stream) {
      throw new Error('Stream not found');
    }

    // Populate streamer info
    const streamer = await userModel.findById(stream.streamer_id);
    if (!streamer) {
      throw new Error('Streamer not found');
    }

    return {
      ...stream,
      streamer: {
        id: streamer.id,
        display_name: streamer.display_name,
        avatar_url: streamer.avatar_url,
      },
    };
  },

  getActiveStream: async (streamerId: string): Promise<StreamResponse | null> => {
    // Find active stream by streamer ID
    const stream = await streamModel.findActiveByStreamerId(streamerId);
    if (!stream) {
      return null;
    }

    // Populate streamer info
    const streamer = await userModel.findById(stream.streamer_id);
    if (!streamer) {
      throw new Error('Streamer not found');
    }

    return {
      ...stream,
      streamer: {
        id: streamer.id,
        display_name: streamer.display_name,
        avatar_url: streamer.avatar_url,
      },
    };
  },
};
