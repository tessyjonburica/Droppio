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
              {user.role === 'streamer' && (
                <Link href="/dashboard">
                  <Button variant="ghost">Dashboard</Button>
                </Link>
              )}
              <Button variant="outline" onClick={logout}>
                Logout
              </Button>
            </>
          ) : (
            <Link href="/login">
              <Button>Login</Button>
            </Link>
          )}
          <WalletConnect />
        </nav>
      </div>
    </header>
  );
}

