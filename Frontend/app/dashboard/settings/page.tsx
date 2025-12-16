'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Header } from '@/components/layout/header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/hooks/use-auth';
import { userService } from '@/services/user.service';
import { useToast } from '@/hooks/use-toast';

export default function SettingsPage() {
  const router = useRouter();
  const { user } = useAuth();
  const { toast } = useToast();
  const [displayName, setDisplayName] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [platform, setPlatform] = useState<'twitch' | 'youtube' | 'kick' | 'tiktok' | ''>('');
  const [payoutWallet, setPayoutWallet] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (user) {
      setDisplayName(user.displayName || '');
      setAvatarUrl(user.avatarUrl || '');
      // TODO: Load platform and payout wallet from user profile
    }
  }, [user]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // TODO: Implement update profile endpoint
      toast({
        title: 'Settings saved',
        description: 'Your profile has been updated',
      });
      router.push('/dashboard');
    } catch (error: any) {
      toast({
        title: 'Failed to save',
        description: error.message || 'Failed to update settings',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <Header />
      <main className="min-h-screen bg-white">
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-2xl mx-auto">
            <h1 className="font-header text-4xl text-primary mb-8">Settings</h1>

            <Card>
              <CardHeader>
                <CardTitle>Profile Settings</CardTitle>
                <CardDescription>Update your creator profile</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSave} className="space-y-4">
                  <div className="space-y-2">
                    <label htmlFor="displayName" className="text-sm font-medium">
                      Display Name
                    </label>
                    <Input
                      id="displayName"
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value)}
                      placeholder="Your display name"
                    />
                  </div>

                  <div className="space-y-2">
                    <label htmlFor="avatarUrl" className="text-sm font-medium">
                      Avatar URL
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
                      Streaming Platform
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
                      Payout Wallet
                    </label>
                    <Input
                      id="payoutWallet"
                      value={payoutWallet}
                      onChange={(e) => setPayoutWallet(e.target.value)}
                      placeholder="0x..."
                      pattern="^0x[a-fA-F0-9]{40}$"
                    />
                  </div>

                  <div className="flex gap-2">
                    <Button type="submit" disabled={isLoading}>
                      {isLoading ? 'Saving...' : 'Save Changes'}
                    </Button>
                    <Button type="button" variant="outline" onClick={() => router.back()}>
                      Cancel
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </>
  );
}

