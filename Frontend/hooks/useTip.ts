// Tip Hook
// Wagmi-powered hook for sending native ETH tips

'use client';

import { useState, useCallback } from 'react';
import { useAccount, useWriteContract, usePublicClient } from 'wagmi';
import { parseEther } from 'viem';

export type TipState = 'idle' | 'pending' | 'success' | 'error';

export interface UseTipReturn {
  sendTip: (creatorAddress: string, amountEth: string) => Promise<string | null>;
  state: TipState;
  txHash: string | null;
  error: Error | null;
  reset: () => void;
}

export interface UseTipOptions {
  onSuccess?: (txHash: string) => void;
  onError?: (error: Error) => void;
}

/**
 * Hook for sending tips on-chain
 * Handles transaction states and errors
 * Returns transaction hash on success
 */
export function useTip(options?: UseTipOptions): UseTipReturn {
  const { address, isConnected } = useAccount();
  const { writeContractAsync } = useWriteContract();
  const publicClient = usePublicClient();

  const [state, setState] = useState<TipState>('idle');
  const [txHash, setTxHash] = useState<string | null>(null);
  const [error, setError] = useState<Error | null>(null);

  const sendTip = useCallback(
    async (creatorAddress: string, amountEth: string): Promise<string | null> => {
      // Reset state
      setError(null);
      setTxHash(null);
      setState('pending');

      try {
        // Validate inputs
        if (!isConnected || !address) {
          throw new Error('Wallet not connected');
        }

        if (!publicClient) {
          throw new Error('Public client not available');
        }

        if (!creatorAddress || !creatorAddress.startsWith('0x')) {
          throw new Error('Invalid creator address');
        }

        const amount = parseFloat(amountEth);
        if (isNaN(amount) || amount <= 0) {
          throw new Error('Invalid tip amount');
        }

        // Convert ETH to wei (using viem)
        const amountWei = parseEther(amountEth);

        // Dynamic import for config to avoid cycles/ssr issues if any
        const { DROPPIO_CONTRACT_ADDRESS } = await import('@/lib/ethers/config');
        const { DROPPIO_ABI } = await import('@/lib/ethers/abi');

        // Send tip transaction
        const hash = await writeContractAsync({
          address: DROPPIO_CONTRACT_ADDRESS as `0x${string}`,
          abi: DROPPIO_ABI,
          functionName: 'tip',
          args: [creatorAddress],
          value: amountWei
        });

        // Wait for transaction confirmation
        await publicClient.waitForTransactionReceipt({ hash });

        setTxHash(hash);
        setState('success');

        options?.onSuccess?.(hash);
        return hash;
      } catch (err: any) {
        // Log the full error to console for debugging
        console.error('Tip Error:', err);

        const tipError = err instanceof Error ? err : new Error('Failed to send tip');

        // Handle specific error cases
        const errorMsg = tipError.message || '';
        if (errorMsg.includes('User rejected') || errorMsg.includes('User denied')) {
          tipError.message = 'Transaction rejected by user';
        } else if (errorMsg.includes('insufficient funds') || errorMsg.includes('exceeds balance')) {
          tipError.message = 'Insufficient balance';
        }

        setError(tipError);
        setState('error');
        options?.onError?.(tipError);
        return null;
      }
    },
    [isConnected, address, writeContractAsync, publicClient, options]
  );

  const reset = useCallback(() => {
    setState('idle');
    setTxHash(null);
    setError(null);
  }, []);

  return {
    sendTip,
    state,
    txHash,
    error,
    reset,
  };
}

