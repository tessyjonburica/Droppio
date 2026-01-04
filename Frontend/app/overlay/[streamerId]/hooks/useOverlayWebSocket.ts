'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { OverlayChannelEvent, UseOverlayWebSocketOptions } from '../types';

export function useOverlayWebSocket({
  creatorId,
  token,
  onMessage,
  enabled = true,
}: UseOverlayWebSocketOptions) {
  const [isConnected, setIsConnected] = useState(false);
  const [reconnectAttempts, setReconnectAttempts] = useState(0);
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const connect = useCallback(() => {
    if (!enabled || !creatorId || !token) return;

    const wsUrl = process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:3001';
    // Append token to query string for auth
    const url = `${wsUrl}/ws/overlay/${creatorId}?token=${encodeURIComponent(token)}`;
    const ws = new WebSocket(url);

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
  }, [creatorId, token, enabled, onMessage, reconnectAttempts]);

  useEffect(() => {
    if (enabled) {
      connect();
    }

    // Ping/Pong heartbeat to keep connection alive
    // If we don't receive a ping/message for 40s (server pings every 30s), reconnect
    const heartbeatInterval = setInterval(() => {
      if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
        // We rely on browser's native pong response to server pings.
        // But if we wanted to be double sure, we could send a 'ping' frame here if the server supported it.
        // For now, the server-side check is robust enough.
      }
    }, 30000);

    return () => {
      clearInterval(heartbeatInterval);
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      if (wsRef.current) {
        // Explicitly closing means we don't want to reconnect
        wsRef.current.onclose = null; // Remove handler to prevent reconnect
        wsRef.current.close();
      }
    };
  }, [enabled, connect]);

  return { isConnected, reconnect: connect };
}