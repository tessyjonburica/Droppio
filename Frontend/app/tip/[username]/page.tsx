'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams } from 'next/navigation';
import { useAccount, useSignMessage } from 'wagmi';
import { Header } from '@/components/layout/header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { WalletConnect } from '@/components/auth/wallet-connect';
import { tipService, TipResponse } from '@/services/tip.service';
import { streamService } from '@/services/stream.service';
import { creatorService, CreatorProfile } from '@/services/creator.service';
import { useWebSocket, StreamerChannelEvent, ViewerChannelEvent, OverlayChannelEvent } from '@/hooks/use-websocket';
import { usePolling } from '@/hooks/use-polling';
import { useToast } from '@/hooks/use-toast';
import { generateMessage } from '@/utils/signature';
import { formatDistanceToNow } from 'date-fns';
import { useAuthStore } from '@/store/auth-store';
import { authService } from '@/services/auth.service';
import { useTip } from '@/hooks/useTip';
import { SuccessModal } from '@/components/tip/SuccessModal';

export default function TipPage() {
  const params = useParams();
  const username = params.username as string;
  const { address, isConnected } = useAccount();
  const { toast } = useToast();
  const { user, isAuthenticated } = useAuthStore();
  const [creator, setCreator] = useState<CreatorProfile | null>(null);
  const [isLoadingCreator, setIsLoadingCreator] = useState(true);
  const [activeStream, setActiveStream] = useState<any>(null);
  const [amount, setAmount] = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [recentTips, setRecentTips] = useState<TipResponse[]>([]);

  // Real Tip Hook
  const { sendTip: sendOnChainTip, state: tipState, reset: resetTipState } = useTip();
  const { signMessageAsync } = useSignMessage();

  // Success Modal State
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [successTxHash, setSuccessTxHash] = useState('');

  // Load creator profile
  useEffect(() => {
    const loadCreator = async () => {
      try {
        setIsLoadingCreator(true);
        const profile = await creatorService.getByUsername(username);
        setCreator(profile);
      } catch (error) {
        console.error('Failed to load creator:', error);
      } finally {
        setIsLoadingCreator(false);
      }
    };
    if (username) {
      loadCreator();
    }
  }, [username]);

  const handleLogin = async () => {
    if (!isConnected || !address) return;

    setIsLoggingIn(true);
    try {
      const timestamp = Date.now();
      const message = generateMessage(address, timestamp);

      // Use Wagmi hook for better mobile support
      const signature = await signMessageAsync({ message });

      await authService.login({
        walletAddress: address,
        signature,
        message,
        role: 'viewer'
      });

      toast({
        title: 'Successfully connected',
        description: 'You can now send tips',
      });
    } catch (error: any) {
      toast({
        title: 'Authentication failed',
        description: error.message || 'Failed to sign in',
        variant: 'destructive',
      });
    } finally {
      setIsLoggingIn(false);
    }
  };

  // Auto-authenticate when wallet is connected but not authenticated
  useEffect(() => {
    if (isConnected && address && !isAuthenticated && !isLoggingIn) {
      handleLogin();
    }
  }, [isConnected, address, isAuthenticated, isLoggingIn]);


  // Load active stream
  const loadActiveStream = useCallback(async () => {
    if (!creator?.id) return null;
    try {
      const stream = await streamService.getActiveStream(creator.id);
      setActiveStream(stream);
      // Load recent tips when stream is found
      if (stream) {
        try {
          const tips = await tipService.getTipsByStream(stream.id);
          setRecentTips(tips);
        } catch (tipError) {
          // Tips endpoint might not exist yet, that's okay
          console.error('Failed to load tips:', tipError);
        }
      }
      return stream;
    } catch (error) {
      // Stream might not be active, that's okay
      setActiveStream(null);
      return null;
    }
  }, [creator?.id]);

  useEffect(() => {
    if (creator?.id) {
      loadActiveStream();
    }
  }, [creator?.id, loadActiveStream]);

  // WebSocket for real-time updates
  const { isConnected: wsConnected } = useWebSocket({
    channel: 'viewer',
    id: activeStream?.id || '',
    enabled: !!activeStream?.id,
    onMessage: (event: StreamerChannelEvent | ViewerChannelEvent | OverlayChannelEvent) => {
      if (event.type === 'stream_started') {
        setActiveStream(event.data);
      } else if (event.type === 'stream_ended') {
        setActiveStream(null);
      }
    },
  });

  // Polling fallback
  usePolling({
    fetchFn: loadActiveStream,
    onData: (stream) => {
      if (stream) setActiveStream(stream);
    },
    interval: 5000,
    enabled: !wsConnected && !!creator?.id,
  });

  const handleTip = async () => {
    if (!isAuthenticated || !address) {
      toast({
        title: 'Not signed in',
        description: 'Please connect your wallet to send a tip',
        variant: 'destructive',
      });
      return;
    }

    if (!creator) {
      toast({
        title: 'Creator not loaded',
        description: 'Please wait for creator profile to load',
        variant: 'destructive',
      });
      return;
    }

    // Prevention: Creators cannot tip themselves
    if (user?.walletAddress.toLowerCase() === creator.wallet_address.toLowerCase()) {
      toast({
        title: 'Action not allowed',
        description: 'You cannot tip your own profile',
        variant: 'destructive',
      });
      return;
    }

    const tipAmount = parseFloat(amount);
    if (isNaN(tipAmount) || tipAmount <= 0) {
      toast({
        title: 'Invalid amount',
        description: 'Please enter a valid tip amount',
        variant: 'destructive',
      });
      return;
    }

    try {
      // 1. Send Real On-Chain ETH Transaction
      const hash = await sendOnChainTip(creator.wallet_address, amount);
      if (!hash) return; // Hook already handles error state

      // 2. Notify Backend with Tx Hash
      const tipData: any = {
        amountEth: tipAmount.toString(),
        txHash: hash,
      };

      if (activeStream) {
        tipData.streamId = activeStream.id;
      } else {
        tipData.creatorId = creator.id;
      }

      const newTip = await tipService.sendTip(tipData);

      // 3. Update UI and show success modal
      setRecentTips((prev) => [newTip, ...prev].slice(0, 10));
      setSuccessTxHash(hash);
      setShowSuccessModal(true);
      setAmount('');
    } catch (error: any) {
      console.error('Tip execution error:', error);
      toast({
        title: 'Tip failed',
        description: error.message || 'Failed to send tip. Please try again.',
        variant: 'destructive',
      });
    }
  };

  const handleCloseSuccess = () => {
    setShowSuccessModal(false);
    resetTipState();
  };


  if (isLoadingCreator) {
    return (
      <>
        <Header />
        <main className="min-h-screen bg-soft-mint">
          <div className="container mx-auto px-4 py-8">
            <div className="max-w-2xl mx-auto">
              <Card>
                <CardContent className="p-8 text-center">
                  <p className="text-muted-foreground">Loading creator profile...</p>
                </CardContent>
              </Card>
            </div>
          </div>
        </main>
      </>
    );
  }

  if (!creator) {
    return (
      <>
        <Header />
        <main className="min-h-screen bg-soft-mint">
          <div className="container mx-auto px-4 py-8">
            <div className="max-w-2xl mx-auto">
              <Card>
                <CardContent className="p-8 text-center">
                  <p className="text-muted-foreground">Creator not found</p>
                </CardContent>
              </Card>
            </div>
          </div>
        </main>
      </>
    );
  }

  return (
    <>
      <Header />
      <main className="min-h-screen bg-soft-mint">
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-2xl mx-auto">
            {/* Creator Profile */}
            <Card className="mb-6">
              <CardHeader>
                <div className="flex items-center gap-4">
                  {creator?.avatar_url ? (
                    <img
                      src={creator.avatar_url}
                      alt={creator.display_name || 'Creator'}
                      className="w-16 h-16 rounded-full"
                    />
                  ) : (
                    <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center">
                      <span className="text-2xl text-primary font-bold">
                        {(creator?.display_name || 'C')[0].toUpperCase()}
                      </span>
                    </div>
                  )}
                  <div>
                    <CardTitle className="text-2xl">
                      {creator?.display_name || 'Creator'}
                    </CardTitle>
                    <CardDescription>
                      {activeStream ? (
                        <span className="flex items-center gap-2">
                          <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>
                          <span className="font-medium text-red-600">Live</span> on {activeStream.platform}
                        </span>
                      ) : (
                        <span className="flex items-center gap-2">
                          <span className="w-2 h-2 bg-gray-400 rounded-full"></span>
                          <span className="text-muted-foreground">Offline • Tips go directly to wallet</span>
                        </span>
                      )}
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
            </Card>

            {/* Tip Input */}
            <Card className="mb-6">
              <CardHeader>
                <CardTitle>Send a Tip</CardTitle>
                <CardDescription>
                  Support {creator?.display_name || 'this creator'} with a tip
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <label htmlFor="amount" className="text-sm font-medium">
                    Amount (ETH)
                  </label>
                  <Input
                    id="amount"
                    type="number"
                    step="0.0001"
                    min="0"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="0.0000"
                    disabled={!isAuthenticated || !creator || tipState === 'pending'}
                  />
                </div>
                {!isAuthenticated ? (
                  <div className="space-y-2">
                    {!isConnected ? (
                      <WalletConnect />
                    ) : (
                      <Button
                        onClick={handleLogin}
                        className="w-full"
                        disabled={isLoggingIn}
                      >
                        {isLoggingIn ? 'Connecting...' : 'Connect wallet to tip'}
                      </Button>
                    )}
                    <p className="text-sm text-muted-foreground text-center">
                      {!isConnected ? 'Connect your wallet to start' : 'Sign a message to verify your wallet'}
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <Button
                      onClick={handleTip}
                      disabled={tipState === 'pending' || !creator || !amount}
                      className="w-full"
                    >
                      {tipState === 'pending' ? 'Processing...' : `Tip ${creator?.display_name || 'Creator'}`}
                    </Button>
                    <p className="text-xs text-muted-foreground text-center">
                      Signed in as {user?.walletAddress.slice(0, 6)}...{user?.walletAddress.slice(-4)}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Recent Tips */}
            <Card>
              <CardHeader>
                <CardTitle>Recent Tips</CardTitle>
                <CardDescription>Latest tips from viewers</CardDescription>
              </CardHeader>
              <CardContent>
                {recentTips.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    No tips yet. Be the first!
                  </p>
                ) : (
                  <div className="space-y-2">
                    {recentTips.map((tip) => {
                      const viewerName = tip.viewer?.display_name;
                      const viewerAddress = tip.viewer?.wallet_address || '';
                      const addressDisplay = viewerName || `${viewerAddress.slice(0, 6)}...${viewerAddress.slice(-4)}`;

                      return (
                        <div
                          key={tip.id}
                          className="flex items-center justify-between p-3 border rounded-md bg-white"
                        >
                          <div>
                            <p className="font-medium">{addressDisplay}</p>
                            <p className="text-sm text-muted-foreground">
                              {formatDistanceToNow(new Date(tip.created_at), { addSuffix: true })}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="font-bold text-primary">{tip.amount_eth} ETH</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </main>

      {/* Success Modal */}
      <SuccessModal
        isOpen={showSuccessModal}
        onClose={handleCloseSuccess}
        amount={amount}
        creatorName={creator?.display_name || 'creator'}
        txHash={successTxHash}
      />
    </>
  );
}
