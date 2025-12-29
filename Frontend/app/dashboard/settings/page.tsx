'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/hooks/use-auth';
import { userService } from '@/services/user.service';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, User, MessageSquare, Monitor, Wallet } from 'lucide-react';

export default function SettingsPage() {
  const router = useRouter();
  const { user } = useAuth();
  const { toast } = useToast();
  const [displayName, setDisplayName] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [bio, setBio] = useState('');
  const [platform, setPlatform] = useState<'twitch' | 'youtube' | 'kick' | 'tiktok' | ''>('');
  const [payoutWallet, setPayoutWallet] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const loadProfile = async () => {
      try {
        const profile = await userService.getMe();
        setDisplayName(profile.display_name || '');
        setAvatarUrl(profile.avatar_url || '');
        setBio(profile.bio || '');
        setPlatform(profile.platform || '');
        setPayoutWallet(profile.payout_wallet || '');
      } catch (error) {
        console.error('Failed to load profile:', error);
      }
    };

    if (user) {
      loadProfile();
    }
  }, [user]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      await userService.updateProfile({
        displayName: displayName.trim() || undefined,
        avatarUrl: avatarUrl.trim() || undefined,
        bio: bio.trim() || undefined,
        platform: platform || undefined,
        payoutWallet: payoutWallet.trim() || undefined,
      });

      toast({
        title: 'Settings saved',
        description: 'Your profile has been updated',
      });
      router.push('/dashboard');
    } catch (error: any) {
      toast({
        title: 'Failed to save',
        description: error.response?.data?.error || error.message || 'Failed to update settings',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h1 className="text-3xl font-bold tracking-tight">Profile Settings</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5 text-primary" />
            Basic Information
          </CardTitle>
          <CardDescription>How you appear to others on Droppio</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSave} className="space-y-6">
            <div className="space-y-2">
              <label htmlFor="displayName" className="text-sm font-medium">Display Name</label>
              <Input
                id="displayName"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="Your display name"
                className="bg-muted/50"
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="avatarUrl" className="text-sm font-medium">Avatar URL</label>
              <div className="flex gap-4 items-center">
                {avatarUrl && (
                  <img src={avatarUrl} alt="Avatar Preview" className="w-12 h-12 rounded-full object-cover border" />
                )}
                <Input
                  id="avatarUrl"
                  type="url"
                  value={avatarUrl}
                  onChange={(e) => setAvatarUrl(e.target.value)}
                  placeholder="https://example.com/avatar.jpg"
                  className="bg-muted/50 flex-1"
                />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between">
                <label htmlFor="bio" className="text-sm font-medium flex items-center gap-2">
                  <MessageSquare className="h-4 w-4" />
                  Bio
                </label>
                <span className="text-xs text-muted-foreground">{bio.length}/500</span>
              </div>
              <textarea
                id="bio"
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="Tell viewers about yourself..."
                className="flex min-h-[120px] w-full rounded-md border border-input bg-muted/50 px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                maxLength={500}
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="platform" className="text-sm font-medium flex items-center gap-2">
                <Monitor className="h-4 w-4" />
                Streaming Platform
              </label>
              <select
                id="platform"
                value={platform}
                onChange={(e) => setPlatform(e.target.value as any)}
                className="flex h-10 w-full rounded-md border border-input bg-muted/50 px-3 py-2 text-sm focus:ring-2 focus:ring-primary"
              >
                <option value="">Select platform</option>
                <option value="twitch">Twitch</option>
                <option value="youtube">YouTube</option>
                <option value="kick">Kick</option>
                <option value="tiktok">TikTok</option>
              </select>
            </div>

            <div className="space-y-2">
              <label htmlFor="payoutWallet" className="text-sm font-medium flex items-center gap-2">
                <Wallet className="h-4 w-4" />
                Payout Wallet
              </label>
              <Input
                id="payoutWallet"
                value={payoutWallet}
                onChange={(e) => setPayoutWallet(e.target.value)}
                placeholder="0x..."
                className="bg-muted/50 font-mono"
              />
              <p className="text-[10px] text-muted-foreground italic">Important: Ensure this is a wallet you control to receive your earnings.</p>
            </div>

            <div className="flex gap-4 pt-4">
              <Button type="submit" disabled={isLoading} className="flex-1">
                {isLoading ? 'Saving...' : 'Save Changes'}
              </Button>
              <Button type="button" variant="outline" onClick={() => router.back()} className="flex-1">
                Cancel
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

