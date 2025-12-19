'use client';

import { useEffect } from 'react';
import { useAccount } from 'wagmi';
import { useAuthStore } from '@/store/auth-store';
import { useRouter } from 'next/navigation';

export function useAuth() {
  const { address, isConnected } = useAccount();
  const { user, isAuthenticated, clearAuth } = useAuthStore();
  const router = useRouter();

  // Only restore session for existing authenticated users
  // Don't auto-login viewers - they don't need accounts
  useEffect(() => {
    if (isConnected && address && isAuthenticated) {
      const storedAuth = useAuthStore.getState();
      // Validate stored session matches current wallet
      if (storedAuth.user?.walletAddress !== address) {
        // Wallet changed - clear old session
        clearAuth();
      }
    }
  }, [isConnected, address, isAuthenticated, clearAuth]);

  const logout = async () => {
    // Import authService here to avoid circular dependency
    const { authService } = await import('@/services/auth.service');
    await authService.logout();
    router.push('/');
  };

  return {
    user,
    isAuthenticated,
    isConnected,
    address,
    logout,
  };
}