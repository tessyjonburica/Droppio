'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/hooks/use-auth';
import { streamService } from '@/services/stream.service';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, Video, Key } from 'lucide-react';

export default function StreamManagementPage() {
  const router = useRouter();
  useAuth();
  const { toast } = useToast();
  const [platform, setPlatform] = useState<'twitch' | 'youtube' | 'kick' | 'tiktok' | ''>('');
  const [streamKey, setStreamKey] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleStartStream = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!platform || !streamKey.trim()) {
      toast({
        title: 'Missing information',
        description: 'Please select a platform and enter your stream key',
        variant: 'destructive',
      });
      return;
    }

    setIsLoading(true);

    try {
      await streamService.startStream({
        platform: platform as any,
        streamKey: streamKey.trim(),
      });

      toast({
        title: 'Stream started!',
        description: 'Your stream is now live',
      });

      router.push('/dashboard');
    } catch (error: any) {
      toast({
        title: 'Failed to start stream',
        description: error.response?.data?.error || error.message || 'Failed to start stream',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-xl mx-auto">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h1 className="text-3xl font-bold tracking-tight">Start Stream</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Video className="h-5 w-5 text-primary" />
            Stream Setup
          </CardTitle>
          <CardDescription>Configure your streaming settings</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleStartStream} className="space-y-6">
            <div className="space-y-2">
              <label htmlFor="platform" className="text-sm font-medium">
                Platform
              </label>
              <select
                id="platform"
                value={platform}
                onChange={(e) => setPlatform(e.target.value as any)}
                className="flex h-10 w-full rounded-md border border-input bg-muted/50 px-3 py-2 text-sm focus:ring-2 focus:ring-primary"
                required
              >
                <option value="">Select platform</option>
                <option value="twitch">Twitch</option>
                <option value="youtube">YouTube</option>
                <option value="kick">Kick</option>
                <option value="tiktok">TikTok</option>
              </select>
            </div>

            <div className="space-y-2">
              <label htmlFor="streamKey" className="text-sm font-medium flex items-center gap-2">
                <Key className="h-4 w-4" />
                Stream Key
              </label>
              <Input
                id="streamKey"
                type="password"
                value={streamKey}
                onChange={(e) => setStreamKey(e.target.value)}
                placeholder="Enter your stream key"
                className="bg-muted/50"
                required
              />
              <p className="text-[10px] text-muted-foreground">Your stream key is encrypted and never shared.</p>
            </div>

            <Button type="submit" disabled={isLoading} className="w-full">
              {isLoading ? 'Starting...' : 'Start Stream'}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card className="bg-primary/5 border-primary/20">
        <CardContent className="pt-6">
          <p className="text-sm text-primary-foreground/80 text-primary">
            <strong>Tip:</strong> Make sure your streaming software (OBS/Streamlabs) is configured with the same platform and key before starting.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

