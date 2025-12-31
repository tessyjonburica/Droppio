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

  // Use refs to handle unstable callbacks without resetting the interval
  const savedFetchFn = useRef(fetchFn);
  const savedOnData = useRef(onData);

  // Update refs when props change
  useEffect(() => {
    savedFetchFn.current = fetchFn;
    savedOnData.current = onData;
  }, [fetchFn, onData]);

  useEffect(() => {
    if (!enabled) return;

    const poll = async () => {
      try {
        const data = await savedFetchFn.current();
        savedOnData.current(data);
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
  }, [enabled, interval]);
}
