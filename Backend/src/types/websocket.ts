// WebSocket Event Types

// Streamer Channel Events (/ws/streamer/{streamerId})
export interface StreamerTipReceivedEvent {
  type: 'tip_received';
  data: {
    tipId: string;
    amount: string;
    viewer: {
      id: string;
      walletAddress: string;
      displayName: string | null;
    };
    timestamp: string;
  };
}

export interface ViewerJoinedEvent {
  type: 'viewer_joined';
  data: {
    viewerId: string;
    viewerCount: number;
    timestamp: string;
  };
}

export interface ViewerLeftEvent {
  type: 'viewer_left';
  data: {
    viewerId: string;
    viewerCount: number;
    timestamp: string;
  };
}

export type StreamerChannelEvent =
  | StreamerTipReceivedEvent
  | ViewerJoinedEvent
  | ViewerLeftEvent;

// Viewer Channel Events (/ws/viewer/{streamId})
export interface StreamStartedEvent {
  type: 'stream_started';
  data: {
    streamId: string;
    streamer: {
      id: string;
      displayName: string | null;
      avatarUrl: string | null;
    };
    platform: string;
    timestamp: string;
  };
}

// Re-export Stream type from stream.ts to avoid conflicts
export type { Stream } from './stream';

export interface StreamEndedEvent {
  type: 'stream_ended';
  data: {
    streamId: string;
    timestamp: string;
  };
}

export type ViewerChannelEvent = StreamStartedEvent | StreamEndedEvent;

// Overlay Channel Events (/ws/overlay/{streamerId})
export interface TipEvent {
  type: 'tip_event';
  data: {
    tipId: string;
    amount: string;
    viewer: {
      displayName: string | null;
      walletAddress: string;
    };
    timestamp: string;
  };
}

export type OverlayChannelEvent = TipEvent;

