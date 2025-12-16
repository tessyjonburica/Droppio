// Chain Guard Hook
// Ensures user is on Base network and prompts switch if needed

'use client';

import { useAccount, useSwitchChain, useChainId } from 'wagmi';
import { BASE_CHAIN_ID } from '@/lib/ethers/config';
import { useEffect, useState } from 'react';

export interface UseChainGuardReturn {
  isBaseNetwork: boolean;
  isSwitching: boolean;
  switchToBase: () => Promise<void>;
  error: Error | null;
}

/**
 * Hook to guard against wrong network
 * Automatically detects if user is on Base
 * Provides switch function if on wrong network
 */
export function useChainGuard(): UseChainGuardReturn {
  const { isConnected } = useAccount();
  const chainId = useChainId();
  const { switchChain, isPending: isSwitching, error } = useSwitchChain();

  const [switchError, setSwitchError] = useState<Error | null>(null);

  const isBaseNetwork = chainId === BASE_CHAIN_ID;

  const switchToBase = async (): Promise<void> => {
    try {
      setSwitchError(null);
      await switchChain({ chainId: BASE_CHAIN_ID });
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to switch network');
      setSwitchError(error);
      throw error;
    }
  };

  // Clear error when chain changes
  useEffect(() => {
    if (isBaseNetwork) {
      setSwitchError(null);
    }
  }, [isBaseNetwork]);

  return {
    isBaseNetwork,
    isSwitching,
    switchToBase,
    error: switchError || (error as Error | null),
  };
}

