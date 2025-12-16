'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Header } from '@/components/layout/header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/hooks/use-auth';
import { streamService } from '@/services/stream.service';
import { useToast } from '@/hooks/use-toast';

export default function StreamManagementPage() {
  const router = useRouter();
  const { user } = useAuth();
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
    <>
      <Header />
      <main className="min-h-screen bg-white">
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-md mx-auto">
            <h1 className="font-header text-4xl text-primary mb-8">Start Stream</h1>

            <Card>
              <CardHeader>
                <CardTitle>Stream Setup</CardTitle>
                <CardDescription>Configure your streaming settings</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleStartStream} className="space-y-4">
                  <div className="space-y-2">
                    <label htmlFor="platform" className="text-sm font-medium">
                      Platform
                    </label>
                    <select
                      id="platform"
                      value={platform}
                      onChange={(e) => setPlatform(e.target.value as any)}
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
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
                    <label htmlFor="streamKey" className="text-sm font-medium">
                      Stream Key
                    </label>
                    <Input
                      id="streamKey"
                      type="password"
                      value={streamKey}
                      onChange={(e) => setStreamKey(e.target.value)}
                      placeholder="Enter your stream key"
                      required
                    />
                  </div>

                  <Button type="submit" disabled={isLoading} className="w-full">
                    {isLoading ? 'Starting...' : 'Start Stream'}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </>
  );
}

