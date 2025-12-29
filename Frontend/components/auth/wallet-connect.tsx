'use client';

import { useAccount, useConnect, useDisconnect } from 'wagmi';
import { Button } from '@/components/ui/button';
import { useEffect } from 'react';

export function WalletConnect({ showDisconnect = true }: { showDisconnect?: boolean }) {
  const { address, isConnected } = useAccount();
  const { connect, connectors, isPending } = useConnect();
  const { disconnect } = useDisconnect();

  if (isConnected && address) {
    return (
      <div className="flex items-center gap-4">
        <span className="text-sm font-mono text-muted-foreground bg-muted/50 px-2 py-1 rounded border">
          {address.slice(0, 6)}...{address.slice(-4)}
        </span>
        {showDisconnect && (
          <Button variant="outline" onClick={() => disconnect()} size="sm">
            Disconnect
          </Button>
        )}
      </div>
    );
  }

  return (
    <div className="flex gap-2">
      {connectors.map((connector) => (
        <Button
          key={connector.uid}
          onClick={() => connect({ connector })}
          disabled={isPending}
        >
          Connect {connector.name}
        </Button>
      ))}
    </div>
  );
}

