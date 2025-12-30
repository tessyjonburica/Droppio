'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { WagmiProvider, createConfig, http } from 'wagmi';
import { base } from 'wagmi/chains';
import { injected, coinbaseWallet, walletConnect, metaMask } from 'wagmi/connectors';
import { useState } from 'react';
import { Toaster } from '@/components/ui/toaster';

const config = createConfig({
  chains: [base],
  connectors: [
    metaMask(),
    coinbaseWallet({
      appName: 'droppio',
    }),
    walletConnect({
      projectId: process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || '3fcc6b4468c3674bcaf833eec9d1a017', // Placeholder
    }),
    injected(),
  ],
  transports: {
    [base.id]: http(process.env.NEXT_PUBLIC_BASE_RPC_URL || 'https://mainnet.base.org'),
  },
});

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient());

  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        {children}
        <Toaster />
      </QueryClientProvider>
    </WagmiProvider>
  );
}

