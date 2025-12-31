// Tip Hook
// Wagmi-powered hook for sending native ETH tips

'use client';

import { useState, useCallback } from 'react';
import { useAccount, useWalletClient } from 'wagmi';
import { Contract, parseEther } from 'ethers';
import { clientToSigner } from '@/lib/ethers/adapter';
import { getDroppioContractWithSigner } from '@/lib/ethers/contract'; // Keeping this if needed, or remove if unused. It was used before.

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
  const { data: walletClient } = useWalletClient();
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

        if (!walletClient) {
          throw new Error('Wallet client not available');
        }

        if (!creatorAddress || !creatorAddress.startsWith('0x')) {
          throw new Error('Invalid creator address');
        }

        const amount = parseFloat(amountEth);
        if (isNaN(amount) || amount <= 0) {
          throw new Error('Invalid tip amount');
        }

        // Convert ETH to wei
        const amountWei = parseEther(amountEth);

        // Create signer from wallet client using adapter
        const signer = clientToSigner(walletClient);

        // Get contract with signer
        const contract = new Contract(
          (await import('@/lib/ethers/config')).DROPPIO_CONTRACT_ADDRESS,
          (await import('@/lib/ethers/abi')).DROPPIO_ABI,
          signer
        );

        // Send tip transaction
        const tx = await contract.tip(creatorAddress, {
          value: amountWei,
        });

        // Wait for transaction confirmation (at least 1 block)
        await tx.wait(1);

        setTxHash(tx.hash);
        setState('success');

        options?.onSuccess?.(tx.hash);
        return tx.hash;
      } catch (err) {
        // Log the full error to console for debugging
        console.error('Tip Error:', err);

        const tipError = err instanceof Error ? err : new Error('Failed to send tip');

        // Handle specific error cases
        if (tipError.message.includes('user rejected') || tipError.message.includes('User rejected')) {
          tipError.message = 'Transaction rejected by user';
        } else if (tipError.message.includes('insufficient funds') || tipError.message.includes('insufficient balance')) {
          tipError.message = 'Insufficient balance';
        } else if (tipError.message.includes('network') || tipError.message.includes('chain')) {
          tipError.message = 'Network error. Please check your connection.';
        } else if (tipError.message.includes('Internal JSON-RPC error')) {
          // Provide more helpful message for generic RPC errors
          tipError.message = 'Wallet error. Please check your balance and network.';
        }

        setError(tipError);
        setState('error');
        options?.onError?.(tipError);
        return null;
      }
    },
    [isConnected, address, walletClient, options]
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

