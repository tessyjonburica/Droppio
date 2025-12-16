'use client';

// WebSocket client for blockchain tip events (overlay widget)
// Native WebSocket client - no dependencies

import { useEffect, useRef, useState, useCallback } from 'react';

export interface TipSentEvent {
  type: 'TIP_SENT';
  creatorId: string;
  tipperAddress: string;
  amountEth: string;
  txHash: string;
  tipMode: 'live' | 'offline';
  timestamp: string;
}

export interface UseBlockchainWebSocketOptions {
  creatorId: string;
  accessToken: string;
  onTipSent?: (event: TipSentEvent) => void;
  enabled?: boolean;
}

export interface UseBlockchainWebSocketReturn {
  isConnected: boolean;
  reconnect: () => void;
  disconnect: () => void;
}

/**
 * WebSocket hook for overlay widget
 * Subscribes to creator channel for TIP_SENT events
 * Auto-reconnects on disconnect
 * Fails silently (no UI errors)
 */
export function useBlockchainWebSocket({
  creatorId,
  accessToken,
  onTipSent,
  enabled = true,
}: UseBlockchainWebSocketOptions): UseBlockchainWebSocketReturn {
  const [isConnected, setIsConnected] = useState(false);
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const reconnectAttemptsRef = useRef(0);
  const maxReconnectAttempts = 10;
  const baseReconnectDelay = 1000; // 1 second

  const connect = useCallback((): void => {
    if (!enabled || !creatorId || !accessToken) {
      return;
    }

    // Close existing connection if any
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }

    try {
      const wsUrl = process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:3001';
      const url = `${wsUrl}/ws/overlay/${creatorId}?token=${encodeURIComponent(accessToken)}`;
      
      const ws = new WebSocket(url);
      wsRef.current = ws;

      ws.onopen = () => {
        setIsConnected(true);
        reconnectAttemptsRef.current = 0;
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          
          // Only handle TIP_SENT events
          if (data.type === 'TIP_SENT') {
            onTipSent?.(data as TipSentEvent);
          }
        } catch {
          // Fail silently - don't log errors in overlay widget
        }
      };

      ws.onerror = () => {
        // Fail silently - no UI errors
        setIsConnected(false);
      };

      ws.onclose = () => {
        setIsConnected(false);
        wsRef.current = null;

        // Auto-reconnect with exponential backoff
        if (enabled && reconnectAttemptsRef.current < maxReconnectAttempts) {
          const delay = Math.min(
            baseReconnectDelay * Math.pow(2, reconnectAttemptsRef.current),
            30000 // Max 30 seconds
          );
          
          reconnectTimeoutRef.current = setTimeout(() => {
            reconnectAttemptsRef.current++;
            connect();
          }, delay);
        }
      };
    } catch {
      // Fail silently
      setIsConnected(false);
    }
  }, [creatorId, accessToken, enabled, onTipSent]);

  const disconnect = useCallback((): void => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
    
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
    
    setIsConnected(false);
    reconnectAttemptsRef.current = maxReconnectAttempts; // Prevent reconnection
  }, []);

  const reconnect = useCallback((): void => {
    disconnect();
    reconnectAttemptsRef.current = 0;
    connect();
  }, [connect, disconnect]);

  useEffect(() => {
    if (enabled && creatorId && accessToken) {
      connect();
    }

    return () => {
      disconnect();
    };
  }, [enabled, creatorId, accessToken, connect, disconnect]);

  return {
    isConnected,
    reconnect,
    disconnect,
  };
}

