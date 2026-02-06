'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/use-auth';
import { streamService, Stream } from '@/services/stream.service';
import { creatorService } from '@/services/creator.service';
import { overlayService } from '@/services/overlay.service';
import { useWebSocket, StreamerChannelEvent, ViewerChannelEvent, OverlayChannelEvent } from '@/hooks/use-websocket';
import { useAuthStore } from '@/store/auth-store';
import { useToast } from '@/hooks/use-toast';
import {
  Copy,
  ExternalLink,
  TrendingUp,
  Video,
  Wifi,
  Clock,
  Zap,
  User,
  Eye,
  LayoutGrid,
  Radio
} from 'lucide-react';
import Link from 'next/link';
import { Input } from '@/components/ui/input';
import { WithdrawButton } from '@/components/dashboard/WithdrawButton';
import { cn } from '@/lib/utils';
import { getDroppioContract } from '@/lib/ethers/contract';

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
  const [showOverlay, setShowOverlay] = useState(false);
  const [contractBalance, setContractBalance] = useState('0.00');

  const loadActiveStream = useCallback(async () => {
    if (!user?.id) return;
    try {
      const stream = await streamService.getActiveStream(user.id);
      setActiveStream(stream);
    } catch (error) {
      console.error('Failed to load active stream:', error);
    }
  }, [user?.id]);

  const generateUrls = useCallback(async () => {
    if (!user?.id) return;

    // Base URL
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL ||
      (typeof window !== 'undefined' ? window.location.origin : 'https://droppio.xyz');

    // Overlay URL - fetch long-lived token
    try {
      const overlayToken = await overlayService.getOverlayToken(user.id);
      setOverlayUrl(`${baseUrl}/overlay/${user.id}?token=${overlayToken}`);
    } catch (error) {
      console.error('[Dashboard] Failed to fetch overlay token:', error);
      // Fall back to access token for backward compatibility
      if (accessToken) {
        setOverlayUrl(`${baseUrl}/overlay/${user.id}?token=${accessToken}`);
      }
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

  // Fetch contract balance for the bottom section
  useEffect(() => {
    const fetchBalance = async () => {
      if (!user?.walletAddress) return;
      try {
        if (!window.ethereum) return;
        const { BrowserProvider, formatEther } = await import('ethers');
        const provider = new BrowserProvider(window.ethereum);
        const contract = getDroppioContract(provider);
        const bal = await contract.balances(user.walletAddress);
        setContractBalance(formatEther(bal));
      } catch (error) {
        console.error('Failed to fetch contract balance:', error);
      }
    };
    fetchBalance();
  }, [user]);


  const handleWebSocketMessage = useCallback((event: StreamerChannelEvent | ViewerChannelEvent | OverlayChannelEvent) => {
    console.log('[Dashboard] Received WebSocket event:', event.type, event);
    if (event.type === 'tip_received') {
      console.log('[Dashboard] Updating recent tips with new tip:', event.data.tipId);

      setRecentTips((prev) => {
        // Deduplication: Check if tip already exists
        const exists = prev.some(tip =>
          (tip.tipId === event.data.tipId) ||
          (tip.id === event.data.tipId)
        );

        if (exists) {
          console.log(`[Dashboard] Duplicate tip received via WebSocket, ignoring: ${event.data.tipId}`);
          return prev;
        }

        const newTips = [event.data, ...prev].slice(0, 10);
        console.log('[Dashboard] New tips state length:', newTips.length);

        // Show toast only for new tips
        toast({
          title: 'New tip received!',
          description: `${event.data.amount} ETH from ${event.data.viewer.displayName || `${event.data.viewer.walletAddress.slice(0, 6)}...`}`,
        });

        // Reload stats to get updated totals from backend
        // Reload stats to get updated totals from backend
        // Add a small delay to allow DB propagation
        console.log('[Dashboard] Triggering stats reload after WebSocket tip (delayed)...');
        setTimeout(() => {
          loadStats();
        }, 1000);

        return newTips;
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

              setRecentTips(prev => {
                if (!tips || tips.length === 0) return prev;

                // Smart merge: Keep existing tips if they are newer/not in the polled list immediately
                // This prevents "flicker" where a WS tip appears then disappears because polling was stale

                // If polled list is significantly shorter, it might be an issue (or just empty)
                // If polled list is longer, we usually want it.

                // Simple strategy: Union by ID, sort by date
                const allTips = [...prev, ...tips];
                const uniqueTipsMap = new Map();

                allTips.forEach(tip => {
                  // Normalize ID
                  const id = tip.tipId || tip.id;
                  if (id && !uniqueTipsMap.has(id)) {
                    uniqueTipsMap.set(id, tip);
                  }
                });

                const uniqueTips = Array.from(uniqueTipsMap.values());

                // Sort by created_at desc
                uniqueTips.sort((a, b) => {
                  const timeA = new Date(a.timestamp || a.created_at).getTime();
                  const timeB = new Date(b.timestamp || b.created_at).getTime();
                  return timeB - timeA;
                });

                return uniqueTips.slice(0, 50); // Keep last 50
              });

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
    <div className="space-y-10">
      {/* Welcome Header */}
      <div>
        <h1 className="text-[40px] font-header text-primary-dark mb-2 tracking-tight">Welcome back, {user.displayName}</h1>
        <p className="text-slate-400 text-lg">Here's what's happening with your stream today.</p>
      </div>

      {/* Stats Overview */}
      <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        <div className="bg-white p-6 rounded-[32px] border border-slate-100 shadow-sm relative overflow-hidden group">
          <div className="flex justify-between items-start mb-4">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">TOTAL REVENUE</span>
            <div className="p-2 border border-slate-50 rounded-lg group-hover:bg-slate-50 transition-colors">
              <LayoutGrid className="h-4 w-4 text-slate-400" />
            </div>
          </div>
          <div className="space-y-1">
            <div className="text-3xl font-black text-primary-dark tracking-tight">{stats.totalTips} ETH</div>
            <p className="text-xs text-slate-400 font-medium px-1">Across all tips</p>
          </div>
        </div>

        <div className="bg-white p-6 rounded-[32px] border border-slate-100 shadow-sm relative overflow-hidden group">
          <div className="flex justify-between items-start mb-4">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">TOTAL TIPS</span>
            <div className="p-2 border border-slate-50 rounded-lg group-hover:bg-slate-50 transition-colors">
              <TrendingUp className="h-4 w-4 text-slate-400" />
            </div>
          </div>
          <div className="space-y-1">
            <div className="text-3xl font-black text-primary-dark tracking-tight">{stats.totalTipsCount}</div>
            <p className="text-xs text-slate-400 font-medium px-1">Supporters contributed</p>
          </div>
        </div>

        <div className="bg-white p-6 rounded-[32px] border border-slate-100 shadow-sm relative overflow-hidden group">
          <div className="flex justify-between items-start mb-4">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">STREAM STATUS</span>
            <div className="p-2 border border-slate-50 rounded-lg group-hover:bg-slate-50 transition-colors text-slate-400">
              <Radio className="h-4 w-4" />
            </div>
          </div>
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <div className={`w-2.5 h-2.5 rounded-full ${activeStream ? 'bg-red-500 animate-pulse' : 'bg-slate-300'}`} />
              <div className="text-3xl font-black text-primary-dark tracking-tight uppercase">{activeStream ? 'LIVE' : 'OFFLINE'}</div>
            </div>
            <p className="text-xs text-slate-400 font-medium px-1">
              {activeStream ? `Broadcasting on ${activeStream.platform}` : 'Start a session to go live'}
            </p>
          </div>
        </div>

        <div className="bg-white p-6 rounded-[32px] border border-slate-100 shadow-sm relative overflow-hidden group">
          <div className="flex justify-between items-start mb-4">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">SOCKET CONNECTION</span>
            <div className="p-2 border border-slate-50 rounded-lg group-hover:bg-slate-50 transition-colors">
              <Wifi className={cn("h-4 w-4", isConnected ? "text-primary" : "text-slate-400")} />
            </div>
          </div>
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <div className={`w-2.5 h-2.5 rounded-full ${isConnected ? 'bg-primary' : 'bg-red-400'}`} />
              <div className={cn("text-3xl font-black tracking-tight uppercase", isConnected ? "text-primary" : "text-red-400")}>
                {isConnected ? 'ONLINE' : 'OFFLINE'}
              </div>
            </div>
            <p className="text-xs text-slate-400 font-medium px-1">Real-time tip updates active</p>
          </div>
        </div>
      </div>

      <div className="grid gap-8 grid-cols-1 lg:grid-cols-3">
        {/* Left Column: Actions */}
        <div className="lg:col-span-2 space-y-8">
          <div className="bg-white p-8 rounded-[40px] border border-slate-100 shadow-sm space-y-6">
            <div className="flex items-center gap-3">
              <Copy className="h-5 w-5 text-primary" />
              <h3 className="text-xl font-bold text-primary-dark">Tipping Link</h3>
            </div>
            <p className="text-slate-500 text-sm -mt-2">Share this link with your audience to receive crypto tips</p>

            <div className="flex gap-2">
              <div className="flex-1 bg-slate-50/50 border border-slate-100 rounded-2xl p-4 flex items-center">
                <Input value={tippingUrl} readOnly className="border-none bg-transparent p-0 text-slate-600 focus-visible:ring-0 font-medium h-auto" />
              </div>
              <Button onClick={() => copyToClipboard(tippingUrl, 'Tipping URL')} variant="outline" size="icon" className="h-14 w-14 rounded-2xl bg-white border-slate-100 hover:bg-[#F1F9F9] hover:border-primary/20 transition-all">
                <Copy className="h-5 w-5 text-primary" />
              </Button>
              <Link href={tippingUrl} target="_blank">
                <Button variant="outline" size="icon" className="h-14 w-14 rounded-2xl bg-white border-slate-100 hover:bg-[#F1F9F9] hover:border-primary/20 transition-all">
                  <ExternalLink className="h-5 w-5 text-slate-400" />
                </Button>
              </Link>
            </div>
            <p className="text-[10px] text-slate-400 italic">
              Pro tip: Add this to your social media bio or stream description.
            </p>
          </div>

          <div className="bg-white p-8 rounded-[40px] border border-slate-100 shadow-sm space-y-6">
            <div className="flex items-center gap-3">
              <Video className="h-5 w-5 text-primary" />
              <h3 className="text-xl font-bold text-primary-dark">Overlay URL</h3>
            </div>
            <p className="text-slate-500 text-sm -mt-2">Paste this into OBS/Streamlabs Browser Source</p>

            <div className="flex gap-2">
              <div className="flex-1 bg-slate-50/50 border border-slate-100 rounded-2xl p-4 flex items-center relative overflow-hidden h-14">
                <div className="flex-1 flex gap-2 items-center">
                  <div className="flex-1 text-slate-600 font-mono text-sm tracking-tight truncate overflow-hidden">
                    {showOverlay ? overlayUrl : '••••••••••••••••••••••••••••••••••••••••••••••••'}
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-slate-400 hover:text-primary hover:bg-white"
                    onClick={() => setShowOverlay(!showOverlay)}
                  >
                    <Eye className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              <Button onClick={() => copyToClipboard(overlayUrl, 'Overlay URL')} variant="outline" size="icon" className="h-14 w-14 rounded-2xl bg-white border-slate-100 hover:bg-[#F1F9F9] hover:border-primary/20 transition-all">
                <Copy className="h-5 w-5 text-primary" />
              </Button>
              <Button onClick={() => window.open(overlayUrl, '_blank')} variant="outline" size="icon" className="h-14 w-14 rounded-2xl bg-white border-slate-100 hover:bg-[#F1F9F9] hover:border-primary/20 transition-all">
                <ExternalLink className="h-5 w-5 text-slate-400" />
              </Button>
            </div>
            <div className="flex items-center gap-2 text-[10px] text-red-500 font-bold uppercase tracking-wider">
              <Zap className="h-3 w-3 fill-red-500" />
              Never share this URL with anyone. It contains your private access token.
            </div>
          </div>

          <div className="bg-white p-8 rounded-[40px] border border-slate-100 shadow-sm">
            <div className="mb-6">
              <h3 className="text-xl font-bold text-primary-dark">Stream Controls</h3>
            </div>
            {activeStream ? (
              <Button
                variant="destructive"
                className="w-full h-16 rounded-[24px] text-xl font-black bg-red-500 hover:bg-red-600 shadow-lg shadow-red-500/20 transition-all hover:scale-[1.01]"
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
                <Button className="w-full h-16 rounded-[24px] text-xl font-black bg-primary hover:bg-primary/90 shadow-lg shadow-primary/20 transition-all hover:scale-[1.01]">
                  Start New Stream
                </Button>
              </Link>
            )}
          </div>
        </div>

        {/* Right Column: Recent Tips */}
        <div className="bg-white p-8 rounded-[40px] border border-slate-100 shadow-sm flex flex-col min-h-[500px]">
          <div className="space-y-1 mb-8">
            <div className="flex items-center gap-3">
              <Clock className="h-5 w-5 text-primary" />
              <h3 className="text-xl font-bold text-primary-dark">Recent Tips</h3>
            </div>
            <p className="text-slate-400 text-sm">Your latest contributions from viewers</p>
          </div>

          <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 -mr-2 space-y-4">
            {isLoadingTips ? (
              <div className="py-20 text-center text-slate-400 font-medium">Loading tips...</div>
            ) : recentTips.length === 0 ? (
              <div className="py-20 text-center space-y-4">
                <div className="w-16 h-16 bg-[#F1F9F9] rounded-full mx-auto flex items-center justify-center">
                  <Zap className="h-8 w-8 text-primary/30" />
                </div>
                <p className="text-slate-400 font-medium">No tips yet. Start streaming to receive support!</p>
              </div>
            ) : (
              recentTips.map((tip) => {
                const tipId = tip.tipId || tip.id || Math.random().toString();
                const viewerAddress = tip.viewer?.walletAddress || tip.viewer?.wallet_address || '';
                const rawAmount = tip.amount || tip.amount_eth;
                const formattedAmount = Number(rawAmount).toLocaleString('en-US', { maximumFractionDigits: 18 });
                const timestamp = tip.timestamp || tip.created_at;

                return (
                  <div key={tipId} className="flex items-center justify-between p-4 rounded-3xl border border-slate-50 hover:bg-slate-50/50 transition-colors group">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-2xl bg-primary/5 flex items-center justify-center text-primary border border-primary/10">
                        <User className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="font-bold text-slate-700 text-sm">
                          {viewerAddress ? `${viewerAddress.slice(0, 6)}...${viewerAddress.slice(-4)}` : 'Anonymous'}
                        </p>
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wide">
                          {_hasHydrated && timestamp ? new Date(timestamp).toLocaleString('en-GB', { dateStyle: 'short', timeStyle: 'short' }) : '---'}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-black text-primary text-sm whitespace-nowrap">{formattedAmount} ETH</p>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* Bottom Section: Withdraw */}
      <div className="bg-white p-10 rounded-[40px] border border-slate-100 shadow-sm relative overflow-hidden">
        <div className="flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="space-y-2 text-center md:text-left">
            <h3 className="text-2xl font-black text-primary-dark tracking-tight">Withdraw Earnings</h3>
            <p className="text-slate-400 font-medium">Transfer your accumulated tips to your wallet</p>
          </div>
          <WithdrawButton />
        </div>

        <div className="mt-8 pt-8 border-t border-slate-50 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="space-y-1 text-center md:text-left">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">CONTRACT BALANCE</p>
            <div className="text-sm font-black text-primary block px-1 uppercase tracking-tight">
              {contractBalance} ETH available
            </div>
          </div>
          <p className="text-[10px] text-slate-400 italic">Click withdraw to transfer your accumulated tips to your wallet</p>
        </div>

        {/* Decorative Theme Toggle Placement */}
        <div className="hidden lg:flex absolute -right-2 top-1/2 -translate-y-1/2 flex-col gap-2">
          <div className="w-12 h-12 bg-white rounded-l-full shadow-lg flex items-center justify-center border border-slate-100 border-r-0 cursor-not-allowed">
            <div className="w-6 h-6 rounded-full border-2 border-slate-200 flex items-center justify-center relative">
              <div className="w-3 h-3 bg-slate-100 rounded-full" />
              <div className="absolute right-0 w-3 h-3 bg-white" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
