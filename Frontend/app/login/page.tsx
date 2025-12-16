'use client';

import { LoginForm } from '@/components/auth/login-form';
import { WalletConnect } from '@/components/auth/wallet-connect';
import { Logo } from '@/components/brand/logo';

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-soft-mint">
      <div className="w-full max-w-md space-y-8 p-8">
        <div className="text-center">
          <Logo className="text-6xl mb-4" />
          <p className="text-muted-foreground font-body">Wallet-based streaming platform</p>
        </div>
        <div className="space-y-4">
          <WalletConnect />
          <LoginForm />
        </div>
      </div>
    </div>
  );
}

