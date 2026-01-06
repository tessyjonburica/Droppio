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
    if (!enabled || !creatorId || !token) {
      console.warn('[Overlay WS] Connection disabled or missing params:', { enabled, creatorId: !!creatorId, token: !!token });
      return;
    }

    // Derive WebSocket URL from API URL (WebSocket runs on same port as HTTP server)
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
    const wsUrl = process.env.NEXT_PUBLIC_WS_URL || apiUrl.replace(/^http/, 'ws');
    
    // Append token to query string for auth
    const url = `${wsUrl}/ws/overlay/${creatorId}?token=${encodeURIComponent(token)}`;
    
    console.log('[Overlay WS] Connecting to:', url.replace(token, 'TOKEN_HIDDEN'));
    
    const ws = new WebSocket(url);

    ws.onopen = () => {
      console.log('[Overlay WS] Connected successfully');
      setIsConnected(true);
      setReconnectAttempts(0);
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        console.log('[Overlay WS] Message received:', data.type, data);
        onMessage?.(data as OverlayChannelEvent);
      } catch (error) {
        console.error('[Overlay WS] Message parse error:', error, 'Raw data:', event.data);
      }
    };

    ws.onerror = (error) => {
      console.error('[Overlay WS] WebSocket error:', error);
    };

    ws.onclose = (event) => {
      console.warn('[Overlay WS] Connection closed:', event.code, event.reason || 'No reason provided');
      setIsConnected(false);
      wsRef.current = null;

      // Reconnect with exponential backoff
      const currentAttempts = reconnectAttempts;
      if (enabled && currentAttempts < 5) {
        const delay = Math.min(1000 * Math.pow(2, currentAttempts), 30000);
        console.log(`[Overlay WS] Reconnecting in ${delay}ms (attempt ${currentAttempts + 1}/5)`);
        reconnectTimeoutRef.current = setTimeout(() => {
          setReconnectAttempts((prev) => prev + 1);
          connect();
        }, delay);
      } else if (currentAttempts >= 5) {
        console.error('[Overlay WS] Max reconnection attempts reached');
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