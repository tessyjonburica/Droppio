'use client';

import { Logo } from '@/components/brand/logo';
import { WalletConnect } from '@/components/auth/wallet-connect';
import { useAuth } from '@/hooks/use-auth';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export function Header() {
  const { isAuthenticated, user, logout, address } = useAuth();

  // Truncate address for display: 0x7B93...B3ee
  const displayAddress = address
    ? `${address.slice(0, 6)}...${address.slice(-4)}`
    : '';

  return (
    <header className="border-b bg-white border-slate-100">
      <div className="container mx-auto px-6 py-4 flex items-center justify-between">
        <Link href="/" className="flex-shrink-0">
          <Logo className="text-2xl" />
        </Link>

        {/* Centered Navigation */}
        <nav className="absolute left-1/2 -translate-x-1/2 hidden md:block">
          {isAuthenticated && user?.role === 'creator' && (
            <Link href="/dashboard">
              <span className="text-sm font-semibold text-primary/80 hover:text-primary transition-colors cursor-pointer">
                Dashboard
              </span>
            </Link>
          )}
        </nav>

        <div className="flex items-center gap-4">
          {isAuthenticated && user ? (
            <>
              {/* Premium Wallet Badge */}
              <div className="flex items-center gap-2 px-4 py-2 bg-[#F1F9F9] border border-primary/20 rounded-full">
                <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                <span className="text-[13px] font-bold text-primary font-mono tracking-tight">
                  {displayAddress}
                </span>
              </div>

              <Button
                variant="outline"
                onClick={logout}
                className="hidden md:flex border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-slate-900 rounded-xl px-6 h-11 font-semibold transition-all"
              >
                Disconnect
              </Button>
            </>
          ) : (
            <>
              <Link href="/creator-login">
                <Button variant="ghost" className="font-semibold text-slate-600">Creator Login</Button>
              </Link>
              <WalletConnect />
            </>
          )}
        </div>
      </div>
    </header>
  );
}