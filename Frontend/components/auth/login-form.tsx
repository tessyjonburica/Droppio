'use client';

import { useState } from 'react';
import { useAccount } from 'wagmi';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { authService } from '@/services/auth.service';
import { generateMessage } from '@/utils/signature';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { ethers } from 'ethers';

export function LoginForm() {
  const { address, isConnected } = useAccount();
  const router = useRouter();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [role, setRole] = useState<'viewer' | 'creator'>('viewer');

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
        role,
      });

      toast({
        title: 'Login successful',
        description: 'Welcome to Droppio!',
      });

      if (role === 'creator') {
        // Check if user needs onboarding
        if (!response.user.displayName) {
          router.push('/onboard');
        } else {
          router.push('/dashboard');
        }
      } else {
        router.push('/');
      }
    } catch (error: any) {
      console.error('Login error details:', error);
      const errorMessage = error.response?.data?.error || error.message || 'Failed to login';
      toast({
        title: 'Login failed',
        description: errorMessage,
        variant: 'destructive',
      });
      // Don't redirect on error
      return;
    } finally {
      setIsLoading(false);
    }
  };

  if (!isConnected) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Connect Wallet</CardTitle>
          <CardDescription>Please connect your wallet to continue</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Sign In</CardTitle>
        <CardDescription>Sign in with your wallet to access Droppio</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <label className="text-sm font-medium">I am a:</label>
          <div className="flex gap-4">
            <Button
              variant={role === 'viewer' ? 'default' : 'outline'}
              onClick={() => setRole('viewer')}
              type="button"
            >
              Viewer
            </Button>
            <Button
              variant={role === 'creator' ? 'default' : 'outline'}
              onClick={() => setRole('creator')}
              type="button"
            >
              Creator
            </Button>
          </div>
        </div>
        <Button onClick={handleLogin} disabled={isLoading} className="w-full">
          {isLoading ? 'Signing...' : 'Sign In'}
        </Button>
      </CardContent>
    </Card>
  );
}

