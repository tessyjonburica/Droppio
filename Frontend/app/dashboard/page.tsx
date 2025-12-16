'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Header } from '@/components/layout/header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/use-auth';
import { streamService, Stream } from '@/services/stream.service';
import { overlayService } from '@/services/overlay.service';
import { useWebSocket, StreamerChannelEvent } from '@/hooks/use-websocket';
import { useAuthStore } from '@/store/auth-store';
import { useToast } from '@/hooks/use-toast';
import { Copy, ExternalLink } from 'lucide-react';
import Link from 'next/link';
import { Input } from '@/components/ui/input';

export default function DashboardPage() {
  const { isAuthenticated, user } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const { accessToken } = useAuthStore();
  const [activeStream, setActiveStream] = useState<Stream | null>(null);
  const [overlayUrl, setOverlayUrl] = useState('');
  const [recentTips, setRecentTips] = useState<any[]>([]);

  const loadActiveStream = useCallback(async () => {
    if (!user?.id) return;
    try {
      const stream = await streamService.getActiveStream(user.id);
      setActiveStream(stream);
    } catch (error) {
      console.error('Failed to load active stream:', error);
    }
  }, [user?.id]);

  const generateOverlayUrl = useCallback(() => {
    if (!user?.id || !accessToken) return;
    // Use production domain or fallback to current origin
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 
      (typeof window !== 'undefined' ? window.location.origin : 'https://dropp.io');
    const url = `${baseUrl}/overlay/${user.id}?token=${accessToken}`;
    setOverlayUrl(url);
  }, [user?.id, accessToken]);

  useEffect(() => {
    if (!isAuthenticated || user?.role !== 'streamer') {
      router.push('/login');
      return;
    }

    if (!user?.displayName) {
      router.push('/onboard');
      return;
    }

    // Load active stream
    loadActiveStream();
    // Generate overlay URL
    generateOverlayUrl();
  }, [isAuthenticated, user, router, accessToken, loadActiveStream, generateOverlayUrl]);

  // WebSocket for real-time tips
  const { isConnected } = useWebSocket({
    channel: 'streamer',
    id: user?.id || '',
    enabled: !!user?.id,
    onMessage: (event: StreamerChannelEvent) => {
      if (event.type === 'tip_received') {
        setRecentTips((prev) => [event.data, ...prev].slice(0, 10));
        toast({
          title: 'New tip received!',
          description: `${event.data.amount} USDC from ${event.data.viewer.displayName || `${event.data.viewer.walletAddress.slice(0, 6)}...`}`,
        });
      }
    },
  });

  const copyOverlayUrl = () => {
    navigator.clipboard.writeText(overlayUrl);
    toast({
      title: 'Copied!',
      description: 'Overlay URL copied to clipboard',
    });
  };

  if (!isAuthenticated || user?.role !== 'streamer' || !user?.displayName) {
    return null;
  }

  return (
    <>
      <Header />
      <main className="min-h-screen bg-white">
        <div className="container mx-auto px-4 py-8">
          <h1 className="font-header text-4xl text-primary mb-8">Creator Dashboard</h1>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 mb-8">
            {/* Balance Card */}
            <Card>
              <CardHeader>
                <CardTitle>Balance</CardTitle>
                <CardDescription>Your earnings</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-primary mb-2">0 ETH</div>
                <p className="text-sm text-muted-foreground mb-4">Available to withdraw</p>
                <Button variant="outline" className="w-full" disabled>
                  Withdraw (Coming Soon)
                </Button>
              </CardContent>
            </Card>

            {/* Stream Status */}
            <Card>
              <CardHeader>
                <CardTitle>Stream Status</CardTitle>
                <CardDescription>Current stream</CardDescription>
              </CardHeader>
              <CardContent>
                {activeStream ? (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
                      <span className="font-medium">Live</span>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Platform: {activeStream.platform}
                    </p>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={async () => {
                        try {
                          await streamService.endStream(activeStream.id);
                          setActiveStream(null);
                          toast({ title: 'Stream ended' });
                        } catch (error: any) {
                          toast({
                            title: 'Error',
                            description: error.message,
                            variant: 'destructive',
                          });
                        }
                      }}
                    >
                      End Stream
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <p className="text-sm text-muted-foreground">No active stream</p>
                    <Link href="/dashboard/stream">
                      <Button variant="outline" size="sm">
                        Start Stream
                      </Button>
                    </Link>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* WebSocket Status */}
            <Card>
              <CardHeader>
                <CardTitle>Connection</CardTitle>
                <CardDescription>Real-time updates</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2">
                  <div
                    className={`w-3 h-3 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}
                  ></div>
                  <span className="text-sm">{isConnected ? 'Connected' : 'Disconnected'}</span>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Overlay Link Generator */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>Overlay Link</CardTitle>
              <CardDescription>Add this URL to your streaming software</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex gap-2">
                <Input
                  value={overlayUrl}
                  readOnly
                  className="font-mono text-sm"
                />
                <Button onClick={copyOverlayUrl} variant="outline" size="icon">
                  <Copy className="h-4 w-4" />
                </Button>
                <Button
                  onClick={() => window.open(overlayUrl, '_blank')}
                  variant="outline"
                  size="icon"
                >
                  <ExternalLink className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Tips History */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>Recent Tips</CardTitle>
              <CardDescription>Latest tips received</CardDescription>
            </CardHeader>
            <CardContent>
              {recentTips.length === 0 ? (
                <p className="text-sm text-muted-foreground">No tips yet</p>
              ) : (
                <div className="space-y-2">
                  {recentTips.map((tip) => {
                    // Handle both WebSocket event format and API response format
                    const tipId = tip.tipId || tip.id || Math.random().toString();
                    const viewerName = tip.viewer?.displayName || tip.viewer?.display_name;
                    const viewerAddress = tip.viewer?.walletAddress || tip.viewer?.wallet_address || '';
                    const amount = tip.amount || tip.amount_usdc;
                    const timestamp = tip.timestamp || tip.created_at;
                    
                    return (
                      <div
                        key={tipId}
                        className="flex items-center justify-between p-3 border rounded-md"
                      >
                        <div>
                          <p className="font-medium">
                            {viewerName || `${viewerAddress.slice(0, 6)}...${viewerAddress.slice(-4)}`}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {timestamp ? new Date(timestamp).toLocaleString() : 'Just now'}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-primary">{amount} USDC</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Stream History */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>Stream History</CardTitle>
              <CardDescription>Your past streams</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">Stream history coming soon</p>
            </CardContent>
          </Card>

          {/* Settings */}
          <Card>
            <CardHeader>
              <CardTitle>Settings</CardTitle>
              <CardDescription>Manage your creator settings</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Link href="/dashboard/settings">
                <Button variant="outline">Edit Profile</Button>
              </Link>
              <Link href="/dashboard/overlay-settings">
                <Button variant="outline">Overlay Settings</Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </main>
    </>
  );
}
