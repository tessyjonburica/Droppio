'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { useAuthStore } from '@/store/auth-store';

export type StreamerChannelEvent =
  | { type: 'tip_received'; data: { tipId: string; amount: string; viewer: { id: string; walletAddress: string; displayName: string | null }; timestamp: string } }
  | { type: 'viewer_joined'; data: { viewerId: string; viewerCount: number; timestamp: string } }
  | { type: 'viewer_left'; data: { viewerId: string; viewerCount: number; timestamp: string } };

export type ViewerChannelEvent =
  | { type: 'stream_started'; data: { streamId: string; streamer: { id: string; displayName: string | null; avatarUrl: string | null }; platform: string; timestamp: string } }
  | { type: 'stream_ended'; data: { streamId: string; timestamp: string } };

export type OverlayChannelEvent =
  | { type: 'tip_event'; data: { tipId: string; amount: string; viewer: { displayName: string | null; walletAddress: string }; timestamp: string } };

interface UseWebSocketOptions {
  channel: 'streamer' | 'viewer' | 'overlay';
  id: string;
  onMessage?: (event: StreamerChannelEvent | ViewerChannelEvent | OverlayChannelEvent) => void;
  enabled?: boolean;
}

export function useWebSocket({ channel, id, onMessage, enabled = true }: UseWebSocketOptions) {
  const [isConnected, setIsConnected] = useState(false);
  const [reconnectAttempts, setReconnectAttempts] = useState(0);
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const { accessToken } = useAuthStore();

  const connect = useCallback(() => {
    if (!enabled || !id) return;

    const wsUrl = process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:3001';
    let url = `${wsUrl}/ws/${channel}/${id}`;
    
    // For overlay channel, token is passed via URL search params
    // For other channels, token is passed via Authorization header in subprotocol
    const ws = channel === 'overlay' 
      ? new WebSocket(url) // Token will be in URL params from page
      : new WebSocket(url, accessToken ? ['Bearer', accessToken].join(' ') : undefined);

    ws.onopen = () => {
      setIsConnected(true);
      setReconnectAttempts(0);
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        onMessage?.(data);
      } catch (error) {
        console.error('WebSocket message parse error:', error);
      }
    };

    ws.onerror = (error) => {
      console.error('WebSocket error:', error);
    };

    ws.onclose = () => {
      setIsConnected(false);
      wsRef.current = null;

      // Reconnect with exponential backoff
      const currentAttempts = reconnectAttempts;
      if (enabled && currentAttempts < 5) {
        const delay = Math.min(1000 * Math.pow(2, currentAttempts), 30000);
        reconnectTimeoutRef.current = setTimeout(() => {
          setReconnectAttempts((prev) => prev + 1);
          connect();
        }, delay);
      }
    };

    wsRef.current = ws;
  }, [channel, id, enabled, accessToken, onMessage]);

  useEffect(() => {
    if (enabled) {
      connect();
    }

    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, [enabled, connect]);

  return { isConnected, reconnect: connect };
}

