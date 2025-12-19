'use client';

import { useState } from 'react';
import { useAccount } from 'wagmi';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Logo } from '@/components/brand/logo';
import { WalletConnect } from '@/components/auth/wallet-connect';
import { authService } from '@/services/auth.service';
import { generateMessage } from '@/utils/signature';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { ethers } from 'ethers';

export default function CreatorLoginPage() {
  const { address, isConnected } = useAccount();
  const router = useRouter();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async () => {
    if (!address || !isConnected) {
      toast({
        title: 'Wallet not connected',
        description: 'Please connect your wallet first',
        variant: 'destructive',
      });
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
      const errorMessage = error.response?.data?.error || error.message || 'Failed to login';
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
          <Logo className="text-6xl mb-4" />
          <h1 className="font-header text-3xl text-primary mb-2">Creator Login</h1>
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
                <Button onClick={handleLogin} disabled={isLoading} className="w-full">
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