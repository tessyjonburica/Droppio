# Droppio EVM Interaction Layer

Production-ready EVM interaction layer using Wagmi and Ethers v6 for sending tips on-chain.

## Architecture

```
Frontend (Wagmi + Ethers v6)
  ↓ useTip hook
Contract Instance (Ethers v6)
  ↓ tip() transaction
Base Network
  ↓ TipSent event
Backend Listener (WebSocket)
  ↓ Persists & broadcasts
Database + WebSocket Clients
```

## Files

### `/lib/ethers/abi.ts`
- Type-safe ABI definition for Droppio contract
- Exports `DROPPIO_ABI` constant
- Includes `tip()` function and `TipSent` event

### `/lib/ethers/config.ts`
- Base chain configuration
- Contract address from environment variable
- Chain ID constants

### `/lib/ethers/contract.ts`
- Contract factory functions
- `getDroppioContract()` - Read-only contract instance
- `getDroppioContractWithSigner()` - Contract with signer for transactions

### `/hooks/useTip.ts`
- Wagmi-powered hook for sending tips
- Handles transaction states: `idle | pending | success | error`
- Returns transaction hash on success
- Comprehensive error handling

### `/hooks/useChainGuard.ts`
- Network safety hook
- Detects if user is on Base network
- Provides `switchToBase()` function
- Handles network switch errors

## Usage

### Basic Tip Hook

```typescript
import { useTip } from '@/hooks/useTip';
import { useChainGuard } from '@/hooks/useChainGuard';

function TipComponent() {
  const { sendTip, state, txHash, error } = useTip({
    onSuccess: (hash) => console.log('Tip sent:', hash),
    onError: (err) => console.error('Tip failed:', err),
  });

  const { isBaseNetwork, switchToBase } = useChainGuard();

  const handleTip = async () => {
    if (!isBaseNetwork) {
      await switchToBase();
      return;
    }

    const hash = await sendTip('0x...', '0.05'); // creatorAddress, amountEth
    console.log('Transaction hash:', hash);
  };

  return (
    <button onClick={handleTip} disabled={state === 'pending'}>
      {state === 'pending' ? 'Sending...' : 'Send Tip'}
    </button>
  );
}
```

### TipButton Component

```typescript
import { TipButton } from '@/components/tip/TipButton';

function CreatorPage() {
  return (
    <TipButton
      creatorAddress="0x..."
      amountEth="0.05"
    />
  );
}
```

## Environment Variables

Add to `.env.local`:

```env
NEXT_PUBLIC_CONTRACT_ADDRESS=0x... # Droppio contract address on Base
NEXT_PUBLIC_BASE_RPC_URL=https://mainnet.base.org
```

## Error Handling

The `useTip` hook handles:

- **User Rejection**: "Transaction rejected by user"
- **Insufficient Balance**: "Insufficient balance"
- **Network Errors**: "Network error. Please check your connection."
- **Invalid Input**: "Invalid creator address" or "Invalid tip amount"

## Transaction States

- `idle`: Ready to send tip
- `pending`: Transaction submitted, waiting for confirmation
- `success`: Transaction confirmed, `txHash` available
- `error`: Transaction failed, `error` contains details

## Network Guard

The `useChainGuard` hook:

- Automatically detects current network
- Prompts user to switch if not on Base
- Handles switch rejection gracefully
- Provides `isSwitching` state for UI feedback

## Best Practices

1. **Always check network**: Use `useChainGuard` before sending tips
2. **Handle errors**: Show user-friendly error messages
3. **Transaction feedback**: Display loading states during pending
4. **Success confirmation**: Show transaction hash and link to BaseScan
5. **Reset state**: Call `reset()` when starting a new tip flow

## Example: Complete Tip Flow

```typescript
'use client';

import { useState } from 'react';
import { useTip } from '@/hooks/useTip';
import { useChainGuard } from '@/hooks/useChainGuard';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';

export function TipForm({ creatorAddress }: { creatorAddress: string }) {
  const [amount, setAmount] = useState('');
  const { sendTip, state, txHash, error, reset } = useTip({
    onSuccess: (hash) => {
      toast({ title: 'Tip sent!', description: `Tx: ${hash}` });
      setAmount('');
      reset();
    },
    onError: (err) => {
      toast({ title: 'Tip failed', description: err.message, variant: 'destructive' });
    },
  });

  const { isBaseNetwork, switchToBase, isSwitching } = useChainGuard();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!isBaseNetwork) {
      await switchToBase();
      return;
    }

    await sendTip(creatorAddress, amount);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Input
        type="number"
        step="0.001"
        min="0"
        value={amount}
        onChange={(e) => setAmount(e.target.value)}
        placeholder="0.0 ETH"
        disabled={state === 'pending'}
      />
      
      {!isBaseNetwork && (
        <Button type="button" onClick={switchToBase} disabled={isSwitching}>
          {isSwitching ? 'Switching...' : 'Switch to Base'}
        </Button>
      )}
      
      <Button type="submit" disabled={state === 'pending' || !amount || !isBaseNetwork}>
        {state === 'pending' ? 'Sending...' : 'Send Tip'}
      </Button>

      {error && <p className="text-red-500">{error.message}</p>}
      {txHash && (
        <a href={`https://basescan.org/tx/${txHash}`} target="_blank" rel="noopener noreferrer">
          View on BaseScan
        </a>
      )}
    </form>
  );
}
```

## Notes

- **No event listeners**: Frontend never reads chain events
- **No backend calls**: All on-chain interactions are direct
- **No stream logic**: Only tip functionality
- **Production-ready**: Error handling, loading states, network guards

