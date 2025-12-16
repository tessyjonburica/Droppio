'use client';

import { useEffect, useRef } from 'react';

interface UsePollingOptions<T> {
  fetchFn: () => Promise<T>;
  onData: (data: T) => void;
  interval?: number;
  enabled?: boolean;
}

export function usePolling<T>({ fetchFn, onData, interval = 5000, enabled = true }: UsePollingOptions<T>) {
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!enabled) return;

    const poll = async () => {
      try {
        const data = await fetchFn();
        onData(data);
      } catch (error) {
        console.error('Polling error:', error);
      }
    };

    // Initial fetch
    poll();

    // Set up interval
    intervalRef.current = setInterval(poll, interval);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [enabled, fetchFn, onData, interval]);
}

