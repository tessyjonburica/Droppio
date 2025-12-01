import { z } from 'zod';
import { PlatformSchema, Platform } from './user';

export interface Stream {
  id: string;
  streamer_id: string;
  platform: Platform;
  stream_key: string;
  is_live: boolean;
  created_at: Date;
  ended_at: Date | null;
}

export interface StartStreamInput {
  platform: Platform;
  streamKey: string;
}

export interface StreamResponse extends Stream {
  streamer?: {
    id: string;
    display_name: string | null;
    avatar_url: string | null;
  };
}
