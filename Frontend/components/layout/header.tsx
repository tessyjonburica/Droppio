'use client';

import { Logo } from '@/components/brand/logo';
import { WalletConnect } from '@/components/auth/wallet-connect';
import { useAuth } from '@/hooks/use-auth';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export function Header() {
  const { isAuthenticated, user, logout } = useAuth();

  return (
    <header className="border-b bg-white">
      <div className="container mx-auto px-4 py-4 flex items-center justify-between">
        <Link href="/">
          <Logo className="text-2xl" />
        </Link>
        <nav className="flex items-center gap-4">
          {isAuthenticated && user ? (
            <>
              {user.role === 'creator' && (
                <Link href="/dashboard">
                  <Button variant="ghost">Dashboard</Button>
                </Link>
              )}
              <WalletConnect showDisconnect={false} />
              <Button
                variant="outline"
                onClick={logout}
                className="hover:bg-destructive/10 hover:text-destructive hover:border-destructive transition-colors"
              >
                Disconnect
              </Button>
            </>
          ) : (
            <>
              <Link href="/creator-login">
                <Button variant="ghost">Creator Login</Button>
              </Link>
              <WalletConnect />
            </>
          )}
        </nav>
      </div>
    </header>
  );
}