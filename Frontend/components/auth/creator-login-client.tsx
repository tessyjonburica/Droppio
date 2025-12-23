'use client';

import { useState, useEffect } from 'react';
import { useAccount } from 'wagmi';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Logo } from '@/components/brand/logo';
import dynamic from 'next/dynamic';
import { authService } from '@/services/auth.service';
import { generateMessage } from '@/utils/signature';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { ethers } from 'ethers';
import { checkServerHealth } from '@/services/health-check';

const WalletConnect = dynamic(() => import('@/components/auth/wallet-connect').then(mod => ({ default: mod.WalletConnect })), {
  ssr: false,
  loading: () => <div className="flex gap-2"><button className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-10 px-4 py-2" disabled>Loading...</button></div>
});

export default function CreatorLoginClient() {
  const { address, isConnected } = useAccount();
  const router = useRouter();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [serverStatus, setServerStatus] = useState<{ isHealthy: boolean; message: string } | null>(null);

  // Check server health on mount
  useEffect(() => {
    const checkHealth = async () => {
      const health = await checkServerHealth();
      setServerStatus({ isHealthy: health.isHealthy, message: health.message });
      
      if (!health.isHealthy) {
        toast({
          title: 'Server Connection Issue',
          description: health.message,
          variant: 'destructive',
        });
      }
    };
    
    checkHealth();
  }, [toast]);

  const handleLogin = async () => {
    if (!address || !isConnected) {
      toast({
        title: 'Wallet not connected',
        description: 'Please connect your wallet first',
        variant: 'destructive',
      });
      return;
    }

    // Check server health before attempting login
    const health = await checkServerHealth();
    if (!health.isHealthy) {
      toast({
        title: 'Cannot connect to server',
        description: health.message,
        variant: 'destructive',
      });
      setServerStatus({ isHealthy: false, message: health.message });
      return;
    }

    setIsLoading(true);

    try {
      if (!window.ethereum) {
        throw new Error('Wallet not available');
      }
      const provider = new ethers.BrowserProvider(window.ethereum);
      const timestamp = Date.now();
      const message = generateMessage(address, timestamp);
      const signer = await provider.getSigner();
      const signature = await signer.signMessage(message);

      const response = await authService.login({
        walletAddress: address,
        signature,
        message,
        role: 'creator', // Always creator for this page
      });

      toast({
        title: 'Login successful',
        description: 'Welcome to Droppio!',
      });

      // Check if user needs onboarding
      if (!response.user.displayName) {
        router.push('/onboard');
      } else {
        router.push('/dashboard');
      }
    } catch (error: any) {
      console.error('Login error:', error);
      
      // Extract error message - handle both Error objects and Axios errors
      let errorMessage = 'Failed to login';
      
      if (error instanceof Error) {
        // Standard Error object (from auth.service.ts)
        errorMessage = error.message;
      } else if (error.response?.data) {
        // Axios error with response
        errorMessage = error.response.data.error || error.response.data.message || error.message || 'Failed to login';
      } else if (error.message) {
        // Axios error without response (network error)
        errorMessage = error.message;
      }
      
      toast({
        title: 'Login failed',
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-soft-mint">
      <div className="w-full max-w-md space-y-8 p-8">
        <div className="text-center">
          <h1 className="font-header text-6xl text-primary mb-2">Creator Login</h1>
          <p className="text-muted-foreground font-body">
            Connect your wallet to access your creator dashboard
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Get Started</CardTitle>
            <CardDescription>
              Sign in with your wallet to start receiving tips
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {serverStatus && !serverStatus.isHealthy && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm text-red-800 font-medium mb-1">⚠️ Server Connection Issue</p>
                <p className="text-xs text-red-600">{serverStatus.message}</p>
                <p className="text-xs text-red-600 mt-2">
                  Make sure the backend server is running: <code className="bg-red-100 px-1 rounded">cd Backend && npm run dev</code>
                </p>
              </div>
            )}
            
            {!isConnected ? (
              <>
                <WalletConnect />
                <p className="text-sm text-muted-foreground text-center">
                  Connect your wallet to continue
                </p>
              </>
            ) : (
              <>
                <div className="p-4 bg-soft-mint rounded-lg">
                  <p className="text-sm text-muted-foreground mb-1">Connected as:</p>
                  <p className="font-mono text-sm font-medium">
                    {address?.slice(0, 6)}...{address?.slice(-4)}
                  </p>
                </div>
                <Button onClick={handleLogin} disabled={isLoading || (serverStatus && !serverStatus.isHealthy)} className="w-full">
                  {isLoading ? 'Signing in...' : 'Sign In as Creator'}
                </Button>
              </>
            )}
          </CardContent>
        </Card>

        <div className="text-center text-sm text-muted-foreground">
          <p>
            Just want to tip creators?{' '}
            <a href="/" className="text-primary hover:underline">
              Browse creators
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}