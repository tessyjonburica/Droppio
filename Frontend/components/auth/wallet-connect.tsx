'use client';

import { useAccount, useConnect, useDisconnect } from 'wagmi';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Wallet, LogOut } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useEffect } from 'react';

export function WalletConnect({ showDisconnect = true }: { showDisconnect?: boolean }) {
  const { address, isConnected } = useAccount();
  const { connect, connectors, isPending, error, reset } = useConnect();
  const { disconnect } = useDisconnect();
  const { toast } = useToast();

  useEffect(() => {
    if (error) {
      toast({
        title: 'Connection Failed',
        description: error.message || 'Could not connect to the wallet.',
        variant: 'destructive',
      });
      // Reset the error state so it doesn't show again on next modal open
      const timer = setTimeout(() => reset(), 5000);
      return () => clearTimeout(timer);
    }
  }, [error, toast, reset]);

  // Filter and prioritize connectors
  const filteredConnectors = connectors.filter((connector, index, self) => {
    // Hide generic "Injected" if MetaMask or Phantom is present
    if (connector.id === 'injected') {
      const hasSpecificInjected = self.some(c => c.id === 'metaMask' || c.id === 'phantom');
      if (hasSpecificInjected) return false;
    }

    // De-duplicate by name and type to be safe
    return self.findIndex(c => c.name === connector.name) === index;
  });

  const getWalletIcon = (name: string) => {
    const n = name.toLowerCase();
    if (n.includes('metamask')) return '/icons/wallets/metamask.svg';
    if (n.includes('coinbase')) return '/icons/wallets/coinbase.svg';
    if (n.includes('phantom')) return '/icons/wallets/phantom.svg';
    if (n.includes('walletconnect')) return '/icons/wallets/walletconnect.svg';
    return null;
  };

  if (isConnected && address) {
    return (
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2 px-3 py-1.5 bg-primary/5 rounded-full border border-primary/20">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
          <span className="text-xs font-mono font-medium text-primary">
            {address.slice(0, 6)}...{address.slice(-4)}
          </span>
        </div>
        {showDisconnect && (
          <Button
            variant="ghost"
            onClick={() => disconnect()}
            size="sm"
            className="text-muted-foreground hover:text-destructive hover:bg-destructive/10"
          >
            <LogOut className="h-4 w-4 mr-2" />
            Disconnect
          </Button>
        )}
      </div>
    );
  }

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button className="font-semibold shadow-sm hover:shadow-md transition-all">
          <Wallet className="mr-2 h-4 w-4" />
          Connect Wallet
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-center text-xl font-bold">Connect a Wallet</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="flex flex-col gap-2">
            {filteredConnectors.map((connector) => {
              const icon = getWalletIcon(connector.name);
              return (
                <Button
                  key={connector.uid}
                  variant="outline"
                  className="flex items-center justify-between p-6 h-auto text-lg font-medium hover:bg-primary/5 hover:border-primary/50 transition-all group"
                  onClick={() => connect({ connector })}
                  disabled={isPending}
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center group-hover:bg-primary/10 overflow-hidden">
                      {icon ? (
                        <img src={icon} alt={connector.name} className="w-6 h-6 object-contain" onError={(e) => {
                          // Fallback to Icon if image fails
                          (e.target as HTMLImageElement).style.display = 'none';
                          const fallback = (e.target as HTMLElement).nextElementSibling as HTMLElement;
                          if (fallback) fallback.style.display = 'block';
                        }} />
                      ) : null}
                      <Wallet className={`h-6 w-6 text-muted-foreground group-hover:text-primary transition-colors ${icon ? 'hidden' : 'block'}`} />
                    </div>
                    <span>{connector.name}</span>
                  </div>
                  {isPending && (
                    <div className="w-2 h-2 bg-primary rounded-full animate-ping" />
                  )}
                </Button>
              );
            })}
          </div>
          <p className="text-xs text-center text-muted-foreground mt-2">
            New to wallets? <a href="https://ethereum.org/en/wallets/" target="_blank" rel="noreferrer" className="text-primary hover:underline">Learn more</a>
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
