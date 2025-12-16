// Tip Button Component
// Example Next.js usage of useTip hook

'use client';

import { useTip } from '@/hooks/useTip';
import { useChainGuard } from '@/hooks/useChainGuard';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { useState } from 'react';
import { Loader2, AlertCircle } from 'lucide-react';

interface TipButtonProps {
  creatorAddress: string;
  amountEth: string;
  disabled?: boolean;
  className?: string;
}

/**
 * Tip Button Component
 * Handles tip transaction with proper UX states
 */
export function TipButton({ creatorAddress, amountEth, disabled, className }: TipButtonProps) {
  const { sendTip, state, txHash, error, reset } = useTip({
    onSuccess: (hash) => {
      toast({
        title: 'Tip sent!',
        description: `Transaction: ${hash.slice(0, 10)}...${hash.slice(-8)}`,
      });
    },
    onError: (err) => {
      toast({
        title: 'Tip failed',
        description: err.message,
        variant: 'destructive',
      });
    },
  });

  const { isBaseNetwork, isSwitching, switchToBase, error: chainError } = useChainGuard();
  const { toast } = useToast();
  const [isProcessing, setIsProcessing] = useState(false);

  const handleTip = async () => {
    // Check if on Base network
    if (!isBaseNetwork) {
      try {
        await switchToBase();
        // Wait a moment for chain switch
        await new Promise((resolve) => setTimeout(resolve, 1000));
      } catch (err) {
        toast({
          title: 'Network switch failed',
          description: err instanceof Error ? err.message : 'Please switch to Base network manually',
          variant: 'destructive',
        });
        return;
      }
    }

    setIsProcessing(true);
    try {
      await sendTip(creatorAddress, amountEth);
    } finally {
      setIsProcessing(false);
    }
  };

  // Determine button state
  const isPending = state === 'pending' || isSwitching || isProcessing;
  const isDisabled = disabled || isPending || !isBaseNetwork;

  // Button text based on state
  let buttonText = `Tip ${amountEth} ETH`;
  if (isSwitching) {
    buttonText = 'Switching network...';
  } else if (state === 'pending') {
    buttonText = 'Sending tip...';
  } else if (state === 'success') {
    buttonText = 'Tip sent!';
  } else if (!isBaseNetwork) {
    buttonText = 'Switch to Base';
  }

  return (
    <div className={className}>
      <Button
        onClick={handleTip}
        disabled={isDisabled}
        className="w-full"
      >
        {isPending ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            {buttonText}
          </>
        ) : (
          buttonText
        )}
      </Button>

      {/* Error display */}
      {error && (
        <div className="mt-2 flex items-center gap-2 text-sm text-destructive">
          <AlertCircle className="h-4 w-4" />
          <span>{error.message}</span>
        </div>
      )}

      {/* Chain error display */}
      {chainError && (
        <div className="mt-2 flex items-center gap-2 text-sm text-destructive">
          <AlertCircle className="h-4 w-4" />
          <span>{chainError.message}</span>
        </div>
      )}

      {/* Success display */}
      {txHash && state === 'success' && (
        <div className="mt-2 text-sm text-muted-foreground">
          <a
            href={`https://basescan.org/tx/${txHash}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary hover:underline"
          >
            View on BaseScan
          </a>
        </div>
      )}
    </div>
  );
}

