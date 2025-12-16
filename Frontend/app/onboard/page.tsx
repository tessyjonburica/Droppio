'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAccount } from 'wagmi';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Logo } from '@/components/brand/logo';
import { userService } from '@/services/user.service';
import { useAuthStore } from '@/store/auth-store';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/use-auth';

export default function OnboardPage() {
  const router = useRouter();
  const { address, isConnected } = useAccount();
  const { isAuthenticated, user } = useAuth();
  const { toast } = useToast();
  const [displayName, setDisplayName] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [platform, setPlatform] = useState<'twitch' | 'youtube' | 'kick' | 'tiktok' | ''>('');
  const [payoutWallet, setPayoutWallet] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Redirect if already onboarded
  useEffect(() => {
    if (isAuthenticated && user?.displayName) {
      router.push('/dashboard');
    }
  }, [isAuthenticated, user?.displayName, router]);

  // Redirect if not authenticated
  useEffect(() => {
    if (!isAuthenticated || !isConnected) {
      router.push('/login');
    }
  }, [isAuthenticated, isConnected, router]);

  // Show loading state during redirects
  if ((isAuthenticated && user?.displayName) || !isAuthenticated || !isConnected) {
    return null;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!displayName.trim()) {
      toast({
        title: 'Display name required',
        description: 'Please enter a display name',
        variant: 'destructive',
      });
      return;
    }

    setIsLoading(true);

    try {
      await userService.onboard({
        walletAddress: address!,
        role: 'streamer',
        displayName: displayName.trim(),
        avatarUrl: avatarUrl.trim() || undefined,
        platform: platform || undefined,
        payoutWallet: payoutWallet.trim() || undefined,
      });

      // Refresh user data
      const updatedUser = await userService.getMe();
      useAuthStore.getState().updateUser({
        id: updatedUser.id,
        walletAddress: updatedUser.wallet_address,
        role: updatedUser.role,
        displayName: updatedUser.display_name, // Backend uses snake_case
        avatarUrl: updatedUser.avatar_url,
      });

      toast({
        title: 'Onboarding complete!',
        description: 'Welcome to Droppio!',
      });

      router.push('/dashboard');
    } catch (error: any) {
      toast({
        title: 'Onboarding failed',
        description: error.response?.data?.error || error.message || 'Failed to complete onboarding',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-soft-mint flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Logo className="text-5xl mb-4" />
          <p className="text-muted-foreground font-body">Complete your creator profile</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Creator Onboarding</CardTitle>
            <CardDescription>Set up your profile to start receiving tips</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <label htmlFor="displayName" className="text-sm font-medium">
                  Display Name <span className="text-red-500">*</span>
                </label>
                <Input
                  id="displayName"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="Your display name"
                  required
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="avatarUrl" className="text-sm font-medium">
                  Avatar URL (optional)
                </label>
                <Input
                  id="avatarUrl"
                  type="url"
                  value={avatarUrl}
                  onChange={(e) => setAvatarUrl(e.target.value)}
                  placeholder="https://example.com/avatar.jpg"
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="platform" className="text-sm font-medium">
                  Streaming Platform (optional)
                </label>
                <select
                  id="platform"
                  value={platform}
                  onChange={(e) => setPlatform(e.target.value as any)}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                >
                  <option value="">Select platform</option>
                  <option value="twitch">Twitch</option>
                  <option value="youtube">YouTube</option>
                  <option value="kick">Kick</option>
                  <option value="tiktok">TikTok</option>
                </select>
              </div>

              <div className="space-y-2">
                <label htmlFor="payoutWallet" className="text-sm font-medium">
                  Payout Wallet (optional)
                </label>
                <Input
                  id="payoutWallet"
                  value={payoutWallet}
                  onChange={(e) => setPayoutWallet(e.target.value)}
                  placeholder="0x..."
                  pattern="^0x[a-fA-F0-9]{40}$"
                />
              </div>

              <Button type="submit" disabled={isLoading} className="w-full">
                {isLoading ? 'Creating profile...' : 'Complete Onboarding'}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

