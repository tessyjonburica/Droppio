import { api } from './api';

export interface StartStreamInput {
  platform: 'twitch' | 'youtube' | 'kick' | 'tiktok';
  streamKey: string;
}

export interface Stream {
  id: string;
  streamer_id: string;
  platform: 'twitch' | 'youtube' | 'kick' | 'tiktok';
  stream_key: string;
  is_live: boolean;
  created_at: string;
  ended_at: string | null;
}

export interface StreamResponse extends Stream {
  streamer?: {
    id: string;
    display_name: string | null;
    avatar_url: string | null;
  };
}

export const streamService = {
  async startStream(data: StartStreamInput): Promise<StreamResponse> {
    const response = await api.post<StreamResponse>('/streams/start', data);
    return response.data;
  },

  async endStream(streamId: string): Promise<void> {
    await api.post('/streams/end', { streamId });
  },

  async getStream(streamId: string): Promise<StreamResponse> {
    const response = await api.get<StreamResponse>(`/streams/${streamId}`);
    return response.data;
  },

  async getActiveStream(streamerId: string): Promise<StreamResponse | null> {
    try {
      const response = await api.get<StreamResponse>(`/streams/active/${streamerId}`);
      return response.data;
    } catch (error: any) {
      if (error.response?.status === 404) {
        return null;
      }
      throw error;
    }
  },
};

