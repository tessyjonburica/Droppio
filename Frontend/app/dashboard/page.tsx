'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/use-auth';
import { streamService, Stream } from '@/services/stream.service';
import { creatorService } from '@/services/creator.service';
import { useWebSocket, StreamerChannelEvent, ViewerChannelEvent, OverlayChannelEvent } from '@/hooks/use-websocket';
import { useAuthStore } from '@/store/auth-store';
import { useToast } from '@/hooks/use-toast';
import {
  Copy,
  ExternalLink,
  Wallet,
  TrendingUp,
  Video,
  Wifi,
  WifiOff,
  Share2,
  Clock,
  Zap,
  User
} from 'lucide-react';
import Link from 'next/link';
import { Input } from '@/components/ui/input';
import { WithdrawButton } from '@/components/dashboard/WithdrawButton';

export default function DashboardPage() {
  const { isAuthenticated, user } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const { accessToken, _hasHydrated } = useAuthStore();
  const [activeStream, setActiveStream] = useState<Stream | null>(null);
  const [overlayUrl, setOverlayUrl] = useState('');
  const [tippingUrl, setTippingUrl] = useState('');
  const [recentTips, setRecentTips] = useState<any[]>([]);
  const [isLoadingTips, setIsLoadingTips] = useState(false);
  const [stats, setStats] = useState({ totalTips: '0.00', totalTipsCount: 0 });

  const loadActiveStream = useCallback(async () => {
    if (!user?.id) return;
    try {
      const stream = await streamService.getActiveStream(user.id);
      setActiveStream(stream);
    } catch (error) {
      console.error('Failed to load active stream:', error);
    }
  }, [user?.id]);

  const generateUrls = useCallback(() => {
    if (!user?.id) return;

    // Base URL
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL ||
      (typeof window !== 'undefined' ? window.location.origin : 'https://droppio.xyz');

    // Overlay URL
    if (accessToken) {
      setOverlayUrl(`${baseUrl}/overlay/${user.id}?token=${accessToken}`);
    }

    // Tipping URL - uses display name
    if (user.displayName) {
      setTippingUrl(`${baseUrl}/tip/${user.displayName}`);
    }
  }, [user?.id, user?.displayName, accessToken]);

  const loadStats = useCallback(async () => {
    if (!user?.id) return;
    try {
      console.log(`[Dashboard] Loading stats for creator: ${user.id}`);
      const data = await creatorService.getTotalTips(user.id);
      console.log('[Dashboard] Stats loaded:', data);
      setStats(data);
    } catch (error: any) {
      console.error('[Dashboard] Failed to load stats:', error?.message || error);
      // Keep existing stats on error to avoid UI flicker
      // Stats will be updated on next successful poll
    }
  }, [user?.id]);

  useEffect(() => {
    if (!_hasHydrated) return;

    if (!isAuthenticated || user?.role !== 'creator') {
      router.push('/creator-login');
      return;
    }

    if (!user?.displayName) {
      router.push('/onboard');
      return;
    }

    loadActiveStream();
    generateUrls();
    loadStats();
  }, [isAuthenticated, user, router, accessToken, loadActiveStream, generateUrls, loadStats, _hasHydrated]);

  useEffect(() => {
    const loadAllTips = async () => {
      if (!user?.id) return;
      setIsLoadingTips(true);
      try {
        console.log(`[Dashboard] Loading tips for creator: ${user.id}`);
        const tips = await creatorService.getTipsByCreator(user.id);
        console.log(`[Dashboard] Loaded ${tips?.length || 0} tips`);
        setRecentTips(tips || []);
      } catch (error: any) {
        console.error('[Dashboard] Failed to load tips:', error?.message || error);
        // Set empty array on error to show "no tips" state instead of stuck loading
        setRecentTips([]);
        // Show toast notification for user feedback
        toast({
          title: 'Failed to load tips',
          description: error?.message || 'Please refresh the page',
          variant: 'destructive',
        });
      } finally {
        setIsLoadingTips(false);
      }
    };

    if (user?.id) {
      loadAllTips();
    }
  }, [user?.id, toast]);


  const handleWebSocketMessage = useCallback((event: StreamerChannelEvent | ViewerChannelEvent | OverlayChannelEvent) => {
    console.log('[Dashboard] Received WebSocket event:', event.type, event);
    if (event.type === 'tip_received') {
      console.log('[Dashboard] Updating recent tips with new tip:', event.data.tipId);
      setRecentTips((prev) => {
        const newTips = [event.data, ...prev].slice(0, 10);
        console.log('[Dashboard] New tips state length:', newTips.length);
        return newTips;
      });
      // Reload stats to get updated totals from backend
      console.log('[Dashboard] Triggering stats reload after WebSocket tip...');
      loadStats();
      toast({
        title: 'New tip received!',
        description: `${event.data.amount} ETH from ${event.data.viewer.displayName || `${event.data.viewer.walletAddress.slice(0, 6)}...`}`,
      });
    }
  }, [toast, loadStats]);

  const { isConnected } = useWebSocket({
    channel: 'streamer',
    id: user?.id || '',
    enabled: !!user?.id,
    onMessage: handleWebSocketMessage,
  });

  // Polling for stats and tips (fallback if WebSocket fails)
  useEffect(() => {
    if (!user?.id) return;

    let pollCount = 0;
    let consecutiveErrors = 0;
    const MAX_CONSECUTIVE_ERRORS = 3;

    const pollData = async () => {
      if (!window.navigator.onLine) {
        console.warn('[Dashboard] Polling skipped: offline');
        return;
      }

      pollCount++;
      console.log(`[Dashboard] Polling data (attempt ${pollCount})...`);

      try {
        // Poll stats and tips in parallel
        const [statsResult, tipsResult] = await Promise.allSettled([
          (async () => {
            try {
              const data = await creatorService.getTotalTips(user.id);
              setStats(data);
              console.log('[Dashboard] Stats updated:', data);
              return data;
            } catch (error: any) {
              console.error('[Dashboard] Failed to poll stats:', error?.message || error);
              throw error;
            }
          })(),
          (async () => {
            try {
              const tips = await creatorService.getTipsByCreator(user.id);
              console.log(`[Dashboard] Poll: Tips updated with ${tips?.length || 0} items`);
              setRecentTips(tips);
              return tips;
            } catch (error: any) {
              console.error('[Dashboard] Failed to poll tips:', error?.message || error);
              // Don't throw - we want to keep showing existing tips even if polling fails
              return null;
            }
          })()
        ]);

        // Check if both failed
        if (statsResult.status === 'rejected' && tipsResult.status === 'rejected') {
          consecutiveErrors++;
          if (consecutiveErrors >= MAX_CONSECUTIVE_ERRORS) {
            console.error(`[Dashboard] Polling failed ${consecutiveErrors} times consecutively. Stopping polling.`);
            // Don't clear interval, but log the issue
          }
        } else {
          // Reset error counter on success
          consecutiveErrors = 0;
        }
      } catch (error: any) {
        consecutiveErrors++;
        console.error('[Dashboard] Polling error:', error?.message || error);

        if (consecutiveErrors >= MAX_CONSECUTIVE_ERRORS) {
          console.error(`[Dashboard] Too many consecutive errors (${consecutiveErrors}). Consider checking API status.`);
        }
      }
    };

    // Initial poll
    pollData();

    // Set up interval polling:
    // - Every 60 seconds if WebSocket is ONLINE (health check mode)
    // - Every 10 seconds if WebSocket is OFFLINE (active fallback mode)
    const pollInterval = isConnected ? 60000 : 10000;

    console.log(`[Dashboard] Starting polling with interval: ${pollInterval / 1000}s (WebSocket is ${isConnected ? 'ONLINE' : 'OFFLINE'})`);

    const interval = setInterval(pollData, pollInterval);

    return () => {
      clearInterval(interval);
      console.log('[Dashboard] Polling stopped');
    };
  }, [user?.id, isConnected]); // Re-run effect when isConnected changes to adjust interval



  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: 'Copied!',
      description: `${label} copied to clipboard`,
    });
  };

  if (!_hasHydrated || !isAuthenticated || user?.role !== 'creator' || !user?.displayName) {
    return null;
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight mb-2">Welcome back, {user.displayName}</h1>
        <p className="text-muted-foreground">Here's what's happening with your stream today.</p>
      </div>

      {/* Stats Overview */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <Wallet className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalTips} ETH</div>
            <p className="text-xs text-muted-foreground">Across all tips</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Tips</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalTipsCount}</div>
            <p className="text-xs text-muted-foreground">Supporters contributed</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Stream Status</CardTitle>
            <Video className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${activeStream ? 'bg-red-500 animate-pulse' : 'bg-gray-300'}`} />
              <div className="text-2xl font-bold">{activeStream ? 'LIVE' : 'OFFLINE'}</div>
            </div>
            <p className="text-xs text-muted-foreground">
              {activeStream ? `Broadcasting on ${activeStream.platform}` : 'Start a session to go live'}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Socket Connection</CardTitle>
            {isConnected ? <Wifi className="h-4 w-4 text-green-500" /> : <WifiOff className="h-4 w-4 text-red-500" />}
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${isConnected ? 'text-green-600' : 'text-red-600'}`}>
              {isConnected ? 'ONLINE' : 'OFFLINE'}
            </div>
            <p className="text-xs text-muted-foreground">Real-time tip updates</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Tipping & Overlay Links */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Share2 className="h-5 w-5 text-primary" />
                Tipping Link
              </CardTitle>
              <CardDescription>Share this link with your audience to receive crypto tips</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <Input value={tippingUrl} readOnly className="bg-muted" />
                <Button onClick={() => copyToClipboard(tippingUrl, 'Tipping URL')} variant="secondary" size="icon">
                  <Copy className="h-4 w-4" />
                </Button>
                <Link href={tippingUrl} target="_blank">
                  <Button variant="outline" size="icon">
                    <ExternalLink className="h-4 w-4" />
                  </Button>
                </Link>
              </div>
              <p className="text-xs text-muted-foreground">
                Pro tip: Add this to your social media bio or stream description.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Video className="h-5 w-5 text-primary" />
                Overlay URL
              </CardTitle>
              <CardDescription>Paste this into OBS/Streamlabs Browser Source</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <Input value={overlayUrl} readOnly className="bg-muted font-mono text-[10px]" />
                <Button onClick={() => copyToClipboard(overlayUrl, 'Overlay URL')} variant="secondary" size="icon">
                  <Copy className="h-4 w-4" />
                </Button>
                <Button onClick={() => window.open(overlayUrl, '_blank')} variant="outline" size="icon">
                  <ExternalLink className="h-4 w-4" />
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Never share this URL with anyone. It contains your private access token.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Stream Controls</CardTitle>
            </CardHeader>
            <CardContent>
              {activeStream ? (
                <Button
                  variant="destructive"
                  className="w-full"
                  onClick={async () => {
                    try {
                      await streamService.endStream(activeStream.id);
                      setActiveStream(null);
                      toast({ title: 'Stream ended successfully' });
                    } catch (error: any) {
                      toast({ title: 'Error', description: error.message, variant: 'destructive' });
                    }
                  }}
                >
                  End Active Stream
                </Button>
              ) : (
                <Link href="/dashboard/stream">
                  <Button className="w-full bg-primary hover:bg-primary/90">
                    Start New Stream
                  </Button>
                </Link>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Withdraw Earnings</CardTitle>
              <CardDescription>Transfer your accumulated tips to your wallet</CardDescription>
            </CardHeader>
            <CardContent>
              <WithdrawButton />
            </CardContent>
          </Card>
        </div>

        {/* Recent Tips */}
        <Card className="flex flex-col">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-primary" />
              Recent Tips
            </CardTitle>
            <CardDescription>Your latest contributions from viewers</CardDescription>
          </CardHeader>
          <CardContent className="flex-1 overflow-y-auto max-h-[500px]">
            {isLoadingTips ? (
              <div className="py-20 text-center text-muted-foreground">Loading tips...</div>
            ) : recentTips.length === 0 ? (
              <div className="py-20 text-center text-muted-foreground">
                <Zap className="h-10 w-10 mx-auto mb-4 opacity-20" />
                <p>No tips yet. Start streaming to receive support!</p>
              </div>
            ) : (
              <div className="space-y-4">
                {recentTips.map((tip) => {
                  const tipId = tip.tipId || tip.id || Math.random().toString();
                  const viewerAddress = tip.viewer?.walletAddress || tip.viewer?.wallet_address || '';
                  const rawAmount = tip.amount || tip.amount_eth;
                  // Format amount to avoid scientific notation
                  const amount = Number(rawAmount).toLocaleString('en-US', { maximumFractionDigits: 18 });

                  // Use timestamp
                  const timestamp = tip.timestamp || tip.created_at;

                  return (
                    <div key={tipId} className="flex items-center justify-between p-4 border rounded-xl hover:bg-muted/50 transition-colors">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                          <User className="h-5 w-5" />
                        </div>
                        <div>
                          <p className="font-semibold">
                            {viewerAddress ? `${viewerAddress.slice(0, 6)}...${viewerAddress.slice(-4)}` : 'Anonymous'}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {_hasHydrated && timestamp ? new Date(timestamp).toLocaleString() : '---'}
                            {!tip.stream_id && (
                              <span className="ml-2 inline-flex items-center rounded-full bg-blue-50 px-2 py-0.5 text-[10px] font-medium text-blue-700 ring-1 ring-inset ring-blue-700/10">
                                Offline
                              </span>
                            )}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-lg text-primary">{amount} ETH</p>
                      </div>
                    </div>
                  );
                })
                }
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div >
  );
}
