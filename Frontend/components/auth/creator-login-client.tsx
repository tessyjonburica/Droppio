'use client';

import { useState, useEffect } from 'react';
import { useAccount, useSignMessage, useDisconnect } from 'wagmi';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import dynamic from 'next/dynamic';
import { authService } from '@/services/auth.service';
import { generateMessage } from '@/utils/signature';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { checkServerHealth } from '@/services/health-check';
import Link from 'next/link';
import { ArrowRight, RefreshCcw, CreditCard } from 'lucide-react';


const WalletConnect = dynamic(() => import('@/components/auth/wallet-connect').then(mod => ({ default: mod.WalletConnect })), {
  ssr: false,
  loading: () => <Button disabled variant="outline" className="w-full h-14 rounded-2xl">Loading Wallet...</Button>
});

export default function CreatorLoginClient() {
  const { address, isConnected } = useAccount();
  const { disconnect } = useDisconnect();
  const router = useRouter();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [serverStatus, setServerStatus] = useState<{ isHealthy: boolean; message: string } | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    const checkHealth = async () => {
      const health = await checkServerHealth();
      setServerStatus({ isHealthy: health.isHealthy, message: health.message });
      if (!health.isHealthy) {
        toast({
          title: 'Server Connection Issue',
          description: health.message,
          variant: 'destructive',
        });
      }
    };
    checkHealth();
  }, [toast]);

  const { signMessageAsync } = useSignMessage();
  const handleLogin = async () => {
    if (!address || !isConnected) {
      toast({
        title: 'Wallet not connected',
        description: 'Please connect your wallet first',
        variant: 'destructive',
      });
      return;
    }

    const health = await checkServerHealth();
    if (!health.isHealthy) {
      toast({
        title: 'Cannot connect to server',
        description: health.message,
        variant: 'destructive',
      });
      setServerStatus({ isHealthy: false, message: health.message });
      return;
    }

    setIsLoading(true);
    try {
      const timestamp = Date.now();
      const message = generateMessage(address, timestamp);
      const signature = await signMessageAsync({ message });

      const response = await authService.login({
        walletAddress: address,
        signature,
        message,
        role: 'creator',
      });

      toast({
        title: 'Login successful',
        description: 'Welcome to Droppio!',
      });

      if (!response.user.displayName) {
        router.push('/onboard');
      } else {
        router.push('/dashboard');
      }
    } catch (error: any) {
      console.error('Login error:', error);
      let errorMessage = 'Failed to login';
      if (error instanceof Error) {
        errorMessage = error.message;
      } else if (error?.cause?.code === 4001 || error?.code === 4001) {
        errorMessage = 'Login cancelled';
        toast({
          title: 'Login cancelled',
          description: 'You rejected the signature request',
        });
        return;
      }
      toast({
        title: 'Login failed',
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (!mounted) return null;

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-[#F8FAFB] font-body">
      {/* Left Column: Branding & Info */}
      <div className="hidden md:flex md:w-[55%] bg-[#E6F4F1] relative overflow-hidden flex-col p-12 lg:p-20 justify-start">
        <Link href="/">
          <span className="font-header text-4xl text-primary font-bold">droppio.</span>
        </Link>

        {/* Tagline */}
        <div className="max-w-md relative z-10 mt-32 lg:mt-48">
          <div className="w-20 h-1 bg-primary/20 mb-8 rounded-full" />
          <h2 className="text-4xl lg:text-5xl font-bold text-primary/40 leading-[1.2] tracking-tight">
            The future of creator tipping, decentralised.
          </h2>
        </div>

        {/* Decorative elements - subtle corner gradient */}
        <div className="absolute -bottom-32 -left-32 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
      </div>

      {/* Right Column: Sign-in Form */}
      <div className="flex-1 bg-white flex flex-col p-8 md:p-12 lg:p-20 justify-center relative overflow-hidden">
        {/* Mobile Header */}
        <div className="md:hidden absolute top-8 left-8">
          <Link href="/">
            <span className="font-header text-3xl text-primary font-bold">droppio.</span>
          </Link>
        </div>

        <div className="max-w-md w-full mx-auto space-y-10 relative z-10">
          <div className="space-y-4">
            <h1 className="font-header text-5xl text-primary font-bold">Creator Sign-in</h1>
            <p className="text-slate-500 font-medium leading-relaxed max-w-[340px]">
              Connect your wallet to access your creator dashboard and manage your tips.
            </p>
          </div>

          <div className="space-y-6">
            {isConnected && (
              <Card className="rounded-[2.5rem] border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] bg-white overflow-hidden group transition-all hover:shadow-[0_12px_40px_rgb(0,0,0,0.06)] animate-in fade-in slide-in-from-bottom-2 duration-500">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-[10px] uppercase tracking-[0.2em] font-black text-slate-400">CONNECTED WALLET</span>
                    <span className="flex items-center gap-1.5 px-3 py-1 bg-teal-50 text-[#11BDB7] rounded-full text-[10px] font-black uppercase ring-1 ring-[#11BDB7]/20">
                      <span className="w-1.5 h-1.5 bg-[#11BDB7] rounded-full animate-pulse" />
                      ACTIVE
                    </span>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-slate-50 flex items-center justify-center border border-slate-100 group-hover:bg-primary/5 group-hover:border-primary/20 transition-colors">
                      <CreditCard className="w-5 h-5 text-slate-400 group-hover:text-primary transition-colors" />
                    </div>
                    <div className="space-y-1">
                      <p className="font-mono text-lg font-bold text-slate-900 leading-none">
                        {address?.slice(0, 6)}...{address?.slice(-4)}
                      </p>
                      <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Main Network</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            <div className="space-y-4">
              {!isConnected ? (
                <div className="relative group">
                  <WalletConnect
                    className="w-full h-14 lg:h-16 rounded-[2rem] bg-primary hover:bg-primary/90 text-white text-base lg:text-lg font-black shadow-xl shadow-primary/20 transition-all hover:scale-[1.02] active:scale-[0.98]"
                  />
                </div>
              ) : (
                <Button
                  onClick={handleLogin}
                  disabled={isLoading || (serverStatus?.isHealthy === false)}
                  className="w-full h-14 lg:h-16 rounded-[2rem] bg-primary hover:bg-primary/90 text-white text-base lg:text-lg font-black shadow-xl shadow-primary/20 flex items-center justify-center gap-3 transition-all hover:scale-[1.02] active:scale-[0.98]"
                >
                  {isLoading ? (
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 border-4 border-white/30 border-t-white rounded-full animate-spin" />
                      SIGNING IN...
                    </div>
                  ) : (
                    <>
                      Sign in as a creator
                      <ArrowRight className="w-5 h-5" />
                    </>
                  )}
                </Button>
              )}

              {isConnected && (
                <div className="flex justify-center">
                  <Button
                    variant="ghost"
                    onClick={() => disconnect()}
                    className="text-slate-400 hover:text-primary font-bold text-[10px] gap-2 py-0 h-auto uppercase tracking-widest"
                  >
                    <RefreshCcw className="w-3.5 h-3.5" />
                    Switch wallet
                  </Button>
                </div>
              )}
            </div>
          </div>

          <div className="pt-8 border-t border-slate-50">
            <div className="text-center space-y-2">
              <p className="text-slate-400 font-bold text-[10px] uppercase tracking-widest">Just want to tip creators?</p>
              <Link href="/" className="text-primary hover:underline font-black text-sm block">
                Browse Creators
              </Link>
            </div>
          </div>
        </div>

        {/* Decorative element in bottom right */}
        <div className="absolute -bottom-10 -right-10 opacity-5 pointer-events-none select-none">
          <div className="grid grid-cols-4 gap-4">
            {[...Array(16)].map((_, i) => (
              <div key={i} className="w-4 h-4 rounded-full bg-slate-900" />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
