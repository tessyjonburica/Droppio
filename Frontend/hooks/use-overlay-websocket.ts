'use client';

import { useEffect, useRef, useState, useCallback } from 'react';

export type OverlayChannelEvent = {
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
};

interface UseOverlayWebSocketOptions {
  streamerId: string;
  token: string;
  onMessage?: (event: OverlayChannelEvent) => void;
  enabled?: boolean;
}

export function useOverlayWebSocket({
  streamerId,
  token,
  onMessage,
  enabled = true,
}: UseOverlayWebSocketOptions) {
  const [isConnected, setIsConnected] = useState(false);
  const [reconnectAttempts, setReconnectAttempts] = useState(0);
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const connect = useCallback(() => {
    if (!enabled || !streamerId || !token) return;

    const wsUrl = process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:3001';
    // Token passed via Authorization header in subprotocol
    const url = `${wsUrl}/ws/overlay/${streamerId}`;
    const ws = new WebSocket(url, ['Bearer', token].join(' '));

    ws.onopen = () => {
      setIsConnected(true);
      setReconnectAttempts(0);
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        onMessage?.(data as OverlayChannelEvent);
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
  }, [streamerId, token, enabled, onMessage]);

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

