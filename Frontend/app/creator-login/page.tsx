'use client';

import dynamic from 'next/dynamic';

const CreatorLoginClient = dynamic(() => import('@/components/auth/creator-login-client'), {

  loading: () => (
    <div className="min-h-screen flex items-center justify-center bg-soft-mint">
      <div className="w-full max-w-md space-y-8 p-8">
        <div className="text-center">
          <h1 className="font-header text-6xl text-primary mb-2">Creator Login</h1>
          <p className="text-muted-foreground font-body">
            Connect your wallet to access your creator dashboard
          </p>
        </div>
        <div className="flex justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </div>
    </div>
  ),
});

export default function CreatorLoginPage() {
  return <CreatorLoginClient />;
}