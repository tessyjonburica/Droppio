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
import { formatDistanceToNow } from 'date-fns';
import { useAuthStore } from '@/store/auth-store';
import { authService } from '@/services/auth.service';
import { useTip } from '@/hooks/useTip';
import { SuccessModal } from '@/components/tip/SuccessModal';
import { Sparkles, Wallet, ShieldCheck, LockIcon } from 'lucide-react';
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
  const [currency, setCurrency] = useState<'ETH' | 'SOL' | 'USDC'>('ETH');
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
      toast({ title: 'Invalid amount', description: 'Please enter a valid amount', variant: 'destructive' });
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

  if (isLoadingCreator) return <div className="min-h-screen flex items-center justify-center bg-soft-mint text-primary-dark">Loading your favorite creator...</div>;
  if (!creator) return <div className="min-h-screen flex items-center justify-center bg-soft-mint text-primary-dark">Creator not found</div>;

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#F1F9F9] to-[#E8F2F2] relative overflow-hidden font-sans text-slate-900">
      {/* Background Decorative Elements */}
      <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-primary/5 rounded-full blur-3xl -mr-64 -mt-64" />
      <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-primary/5 rounded-full blur-3xl -ml-32 -mb-32" />

      {/* Top Header Placeholder / Wallet Connect */}
      <div className="container mx-auto px-6 py-8 flex justify-between items-center relative z-20">
        <Link href="/">
          <span className="font-header text-3xl text-primary">droppio.</span>
        </Link>

        {isConnected && address ? (
          <div className="bg-white/80 backdrop-blur-md rounded-full px-6 py-3 shadow-sm border border-white/50 flex flex-col items-end">
            <span className="text-[10px] uppercase tracking-widest font-bold text-primary/60 mb-0.5">CONNECTED WALLET</span>
            <div className="flex items-center gap-3">
              <span className="font-mono font-bold text-primary text-lg">
                {address.slice(0, 6)}...{address.slice(-4)}
              </span>
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center border border-primary/20">
                <Wallet className="w-5 h-5 text-primary" />
              </div>
            </div>
          </div>
        ) : (
          <WalletConnect className="bg-primary text-white rounded-full px-8 py-4 shadow-xl hover:bg-primary/90 transition-all font-bold" />
        )}
      </div>

      <main className="container mx-auto px-6 py-12 relative z-10">
        <div className="flex flex-col lg:flex-row items-start justify-center gap-20 max-w-6xl mx-auto">

          {/* Left: Creator Profile Sidebar */}
          <div className="w-full lg:w-[40%] flex flex-col gap-12">
            <div className="relative inline-block w-fit group">
              <div className="w-56 h-56 rounded-full border-4 border-white shadow-2xl overflow-hidden relative">
                {creator.avatar_url ? (
                  <img src={creator.avatar_url ?? undefined} alt={creator.display_name ?? ""} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                ) : (
                  <div className="w-full h-full bg-primary/20 flex items-center justify-center text-4xl font-bold text-primary">
                    {creator.display_name?.[0].toUpperCase() ?? "C"}
                  </div>
                )}
              </div>
              <div className="absolute bottom-6 right-0 bg-[#FF4B4B] text-white px-4 py-1.5 rounded-full flex items-center gap-2 border-4 border-[#F1F9F9] shadow-lg animate-pulse uppercase text-xs font-bold leading-none">
                <span className="w-2.5 h-2.5 bg-white rounded-full"></span>
                LIVE
              </div>
            </div>

            <div>
              <h1 className="font-header text-6xl md:text-8xl text-primary leading-tight mb-6">
                {creator.display_name}
              </h1>
              <p className="text-xl text-slate-500 leading-relaxed max-w-md">
                {creator.bio || "Building the future of decentralized entertainment. Direct support, direct impact."}
              </p>
            </div>

            <div className="space-y-6">
              <h3 className="text-xs uppercase tracking-[0.2em] font-black text-slate-400">RECENT DROPS</h3>
              <div className="space-y-4">
                {recentTips.length > 0 ? recentTips.map((tip, i) => (
                  <div key={tip.id} className="flex gap-4 items-center">
                    <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center border border-primary/5">
                      <Sparkles className="w-4 h-4 text-primary" />
                    </div>
                    <p className="text-slate-600 font-medium">
                      <span className="font-bold text-slate-900">{tip.viewer?.display_name || 'anon_user'}</span> dropped {tip.amount_eth} ETH
                    </p>
                  </div>
                )) : (
                  <p className="text-slate-400 italic">No tips yet. Be the first!</p>
                )}
              </div>
            </div>
          </div>

          {/* Right: Main Tip Card */}
          <div className="w-full lg:w-[55%]">
            <Card className="rounded-[40px] border-none shadow-[0_32px_80px_rgba(0,0,0,0.06)] bg-white/90 backdrop-blur-xl p-8 md:p-12">
              <CardContent className="p-0 flex flex-col gap-10">
                <div>
                  <h2 className="text-4xl font-bold text-slate-900 mb-2">Send Tip</h2>
                  <p className="text-lg text-slate-500 font-medium">Support the stream with your favorite token</p>
                </div>

                <div className="space-y-3">
                  <label className="text-xs font-black text-slate-400 uppercase tracking-widest">AMOUNT</label>
                  <div className="bg-[#F1F9F9]/50 rounded-[30px] p-6 border-2 border-primary/5 focus-within:border-primary/20 transition-all">
                    <div className="flex items-center gap-2">
                      <span className="text-4xl md:text-6xl font-black text-primary/40 leading-none">$</span>
                      <Input
                        type="number"
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        placeholder="0.00"
                        className="border-none bg-transparent p-0 text-4xl md:text-6xl font-black text-primary focus-visible:ring-0 h-auto placeholder:text-primary/20"
                      />
                    </div>
                  </div>
                </div>

                <div className="flex flex-wrap gap-3">
                  {['1', '50', '100', '2000'].map((val) => (
                    <button
                      key={val}
                      onClick={() => setAmount(val)}
                      className={cn(
                        "px-8 py-4 rounded-full border-2 font-bold transition-all hover:scale-105 active:scale-95",
                        amount === val
                          ? "bg-primary text-white border-primary shadow-lg shadow-primary/20"
                          : "bg-white text-slate-600 border-slate-100 hover:border-primary/30"
                      )}
                    >
                      ${val}
                    </button>
                  ))}
                </div>

                <div className="space-y-4">
                  <label className="text-xs font-black text-slate-400 uppercase tracking-widest">CURRENCY</label>
                  <div className="flex flex-wrap gap-3">
                    {[
                      { id: 'USDC', label: 'USDC', icon: '💎' },
                      { id: 'SOL', label: 'SOL', icon: '💠' },
                      { id: 'ETH', label: 'ETH', icon: '🏛️' },
                    ].map((cur) => (
                      <button
                        key={cur.id}
                        disabled={cur.id !== 'ETH'}
                        onClick={() => setCurrency(cur.id as any)}
                        className={cn(
                          "px-6 py-4 rounded-[28px] border-2 flex items-center gap-3 font-bold transition-all relative overflow-hidden",
                          currency === cur.id
                            ? "bg-primary text-white border-primary shadow-xl shadow-primary/30"
                            : "bg-white text-slate-600 border-slate-100 opacity-60 hover:opacity-100",
                          cur.id !== 'ETH' && "cursor-not-allowed grayscale"
                        )}
                      >
                        <span className="text-xl">{cur.icon}</span>
                        {cur.label}
                        {cur.id !== 'ETH' && <div className="absolute inset-0 bg-slate-900/5 flex items-center justify-center"></div>}
                      </button>
                    ))}
                  </div>
                </div>

                <Button
                  onClick={handleTip}
                  disabled={tipState === 'pending' || !amount}
                  className="w-full h-24 rounded-[32px] bg-primary hover:bg-primary/90 text-white text-2xl font-black shadow-2xl shadow-primary/40 flex items-center justify-center gap-4 transition-all hover:scale-[1.02] active:scale-[0.98]"
                >
                  {tipState === 'pending' ? (
                    <div className="flex items-center gap-3">
                      <div className="w-6 h-6 border-4 border-white/30 border-t-white rounded-full animate-spin" />
                      PROCESSING...
                    </div>
                  ) : (
                    <>
                      <Sparkles className="w-8 h-8" />
                      Send Tip
                    </>
                  )}
                </Button>

                <p className="text-center text-sm font-bold text-slate-400">
                  Transactions are processed instantly on-chain. Gas fees apply.
                </p>
              </CardContent>
            </Card>

            <div className="mt-12 flex justify-center gap-12">
              <div className="flex items-center gap-2 text-slate-400 font-bold text-sm">
                <ShieldCheck className="w-5 h-5" />
                Non-custodial
              </div>
              <div className="flex items-center gap-2 text-slate-400 font-bold text-sm">
                <LockIcon className="w-5 h-5" />
                Encrypted
              </div>
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
