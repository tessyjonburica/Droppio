'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams } from 'next/navigation';
import { useAccount, useSignMessage } from 'wagmi';
import { Card, CardContent } from '@/components/ui/card';
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
import { useAuthStore } from '@/store/auth-store';
import { authService } from '@/services/auth.service';
import { useTip } from '@/hooks/useTip';
import { SuccessModal } from '@/components/tip/SuccessModal';
import { Sparkles, ShieldCheck, LockIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import Link from 'next/link';

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

  useEffect(() => {
    if (isConnected && address && !isAuthenticated && !isLoggingIn) {
      handleLogin();
    }
  }, [isConnected, address, isAuthenticated, isLoggingIn]);

  const loadActiveStream = useCallback(async () => {
    if (!creator?.id) return null;
    try {
      const stream = await streamService.getActiveStream(creator.id);
      setActiveStream(stream);
      if (stream) {
        try {
          const tips = await tipService.getTipsByStream(stream.id);
          setRecentTips(tips);
        } catch (tipError) {
          console.error('Failed to load tips:', tipError);
        }
      }
      return stream;
    } catch (error) {
      setActiveStream(null);
      return null;
    }
  }, [creator?.id]);

  useEffect(() => {
    if (creator?.id) {
      loadActiveStream();
    }
  }, [creator?.id, loadActiveStream]);

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
      toast({ title: 'Not signed in', description: 'Please connect your wallet', variant: 'destructive' });
      return;
    }
    if (!creator) return;

    if (user?.walletAddress.toLowerCase() === creator.wallet_address.toLowerCase()) {
      toast({ title: 'Action not allowed', description: 'You cannot tip yourself', variant: 'destructive' });
      return;
    }

    const tipAmount = parseFloat(amount);
    if (isNaN(tipAmount) || tipAmount <= 0) {
      toast({ title: 'Invalid amount', description: 'Please enter a valid positive amount', variant: 'destructive' });
      return;
    }

    try {
      const hash = await sendOnChainTip(creator.wallet_address, amount);
      if (!hash) return;

      const tipData: any = { amountEth: tipAmount.toString(), txHash: hash };
      if (activeStream) tipData.streamId = activeStream.id;
      else tipData.creatorId = creator.id;

      const newTip = await tipService.sendTip(tipData);
      setRecentTips((prev) => [newTip, ...prev].slice(0, 10));
      setSuccessTxHash(hash);
      setShowSuccessModal(true);
      setAmount('');
    } catch (error: any) {
      toast({ title: 'Tip failed', description: error.message || 'Failed to send tip', variant: 'destructive' });
    }
  };

  const handleCloseSuccess = () => {
    setShowSuccessModal(false);
    resetTipState();
  };

  if (isLoadingCreator) return <div className="min-h-screen flex items-center justify-center bg-soft-mint text-primary-dark font-sans">Loading your favorite creator...</div>;
  if (!creator) return <div className="min-h-screen flex items-center justify-center bg-soft-mint text-primary-dark font-sans">Creator not found</div>;

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#F1F9F9] to-[#E8F2F2] relative overflow-hidden font-sans text-slate-900 flex flex-col">
      {/* Background Decorative Elements */}
      <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-primary/5 rounded-full blur-3xl -mr-64 -mt-64" />
      <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-primary/5 rounded-full blur-3xl -ml-32 -mb-32" />

      {/* Simplified Header */}
      <div className="container mx-auto px-6 py-4 flex justify-start items-center relative z-20">
        <Link href="/">
          <span className="font-header text-2xl text-primary font-bold">droppio.</span>
        </Link>
      </div>

      <main className="container mx-auto px-6 flex-1 flex items-center justify-center relative z-10 py-4">
        {/* Left: Creator Profile Sidebar - More Compact */}
        <div className="w-full lg:w-[40%] flex flex-col gap-6 lg:gap-8 items-center lg:items-start text-center lg:text-left">
          <div className="relative inline-block w-fit group">
            <div className="w-32 h-32 lg:w-40 lg:h-40 rounded-full border-4 border-white shadow-xl overflow-hidden relative">
              {creator.avatar_url ? (
                <img src={creator.avatar_url ?? undefined} alt={creator.display_name ?? ""} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
              ) : (
                <div className="w-full h-full bg-primary/20 flex items-center justify-center text-4xl font-bold text-primary">
                  {creator.display_name?.[0].toUpperCase() ?? "C"}
                </div>
              )}
            </div>
            <div className="absolute bottom-2 right-0 bg-[#FF4B4B] text-white px-3 py-1 rounded-full flex items-center gap-1.5 border-2 border-[#F1F9F9] shadow-lg animate-pulse uppercase text-[10px] font-bold leading-none">
              <span className="w-2 h-2 bg-white rounded-full"></span>
              LIVE
            </div>
          </div>

          <div className="space-y-4">
            <h1 className="text-4xl lg:text-5xl font-black text-primary leading-tight tracking-tight">
              {creator.display_name}
            </h1>
            <p className="text-base lg:text-lg text-slate-500 leading-relaxed max-w-sm">
              {creator.bio || "Building the future of decentralized entertainment. Direct support, direct impact."}
            </p>
          </div>

          <div className="space-y-4 w-full">
            <h3 className="text-[10px] uppercase tracking-[0.2em] font-black text-slate-400">RECENT DROPS</h3>
            <div className="space-y-3">
              {recentTips.length > 0 ? recentTips.map((tip) => (
                <div key={tip.id} className="flex gap-3 justify-center lg:justify-start items-center">
                  <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center border border-primary/5">
                    <Sparkles className="w-3.5 h-3.5 text-primary" />
                  </div>
                  <p className="text-sm text-slate-600 font-medium">
                    <span className="font-bold text-slate-900">{tip.viewer?.display_name || 'anon_user'}</span> dropped {tip.amount_eth} ETH
                  </p>
                </div>
              )) : (
                <p className="text-slate-400 text-sm italic">No tips yet. Be the first!</p>
              )}
            </div>
          </div>
        </div>

        {/* Right: Main Tip Card - Compact & Vertical Alignment */}
        <div className="w-full lg:w-[50%] max-w-md">
          <Card className="rounded-[40px] border-none shadow-[0_32px_80px_rgba(0,0,0,0.06)] bg-white/90 backdrop-blur-xl p-8 lg:p-10">
            <CardContent className="p-0 flex flex-col gap-8">
              <div>
                <h2 className="text-2xl font-bold text-slate-900 mb-1">Send Tip</h2>
                <p className="text-sm text-slate-500 font-medium">Support the stream with ETH</p>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">AMOUNT</label>
                <div className="bg-[#F1F9F9]/50 rounded-[24px] p-4 lg:p-5 border-2 border-primary/5 focus-within:border-primary/20 transition-all">
                  <div className="flex items-center gap-2">
                    <span className="text-3xl lg:text-4xl font-black text-primary/40 leading-none">$</span>
                    <Input
                      type="number"
                      min="0"
                      step="0.01"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      placeholder="0.00"
                      className="border-none bg-transparent p-0 text-3xl lg:text-4xl font-black text-primary focus-visible:ring-0 h-auto placeholder:text-primary/20"
                    />
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap gap-2 lg:gap-3">
                {['1', '50', '100', '500'].map((val) => (
                  <button
                    key={val}
                    onClick={() => setAmount(val)}
                    className={cn(
                      "px-6 py-3 rounded-full border-2 text-sm font-bold transition-all hover:scale-105 active:scale-95",
                      amount === val
                        ? "bg-primary text-white border-primary shadow-lg shadow-primary/20"
                        : "bg-white text-slate-600 border-slate-100 hover:border-primary/30"
                    )}
                  >
                    ${val}
                  </button>
                ))}
              </div>

              <div className="w-full">
                {!isConnected ? (
                  <div className="relative group">
                    <WalletConnect className="w-full h-16 lg:h-20 rounded-[24px] bg-primary hover:bg-primary/90 text-white text-lg lg:text-xl font-black shadow-xl shadow-primary/30 transition-all hover:scale-[1.02] active:scale-[0.98]" />
                  </div>
                ) : !isAuthenticated ? (
                  <Button
                    onClick={handleLogin}
                    disabled={isLoggingIn}
                    className="w-full h-16 lg:h-20 rounded-[24px] bg-primary hover:bg-primary/90 text-white text-lg lg:text-xl font-black shadow-xl shadow-primary/30 transition-all animate-pulse"
                  >
                    {isLoggingIn ? "VERIFYING..." : "VERIFY WALLET TO TIP"}
                  </Button>
                ) : (
                  <Button
                    onClick={handleTip}
                    disabled={tipState === 'pending' || !amount}
                    className="w-full h-16 lg:h-20 rounded-[24px] bg-primary hover:bg-primary/90 text-white text-lg lg:text-xl font-black shadow-xl shadow-primary/30 flex items-center justify-center gap-3 transition-all hover:scale-[1.02] active:scale-[0.98]"
                  >
                    {tipState === 'pending' ? (
                      <div className="flex items-center gap-2">
                        <div className="w-5 h-5 border-4 border-white/30 border-t-white rounded-full animate-spin" />
                        PROCESSING...
                      </div>
                    ) : (
                      <>
                        <Sparkles className="w-6 h-6" />
                        Send Tip
                      </>
                    )}
                  </Button>
                )}

                {isConnected && (
                  <p className="text-center text-[10px] font-bold text-primary/40 mt-3 uppercase tracking-tighter">
                    Connected: {address?.slice(0, 6)}...{address?.slice(-4)}
                  </p>
                )}
              </div>

              <p className="text-center text-[10px] font-bold text-slate-400">
                Transactions are processed instantly on-chain. Gas fees apply.
              </p>
            </CardContent>
          </Card>

          <div className="mt-8 lg:mt-10 flex justify-center gap-8">
            <div className="flex items-center gap-2 text-slate-400 font-bold text-[10px] lg:text-xs">
              <ShieldCheck className="w-4 h-4" />
              Non-custodial
            </div>
            <div className="flex items-center gap-2 text-slate-400 font-bold text-[10px] lg:text-xs">
              <LockIcon className="w-4 h-4" />
              Encrypted
            </div>
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
    </div>
  );
}
