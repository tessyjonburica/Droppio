'use client';

import { useEffect } from 'react';
import { useAccount, useDisconnect } from 'wagmi';
import { useAuthStore } from '@/store/auth-store';
import { useRouter } from 'next/navigation';

export function useAuth() {
  const { address, isConnected } = useAccount();
  const { user, isAuthenticated, clearAuth } = useAuthStore();
  const router = useRouter();

  // Handle manual wallet disconnection
  useEffect(() => {
    if (!isConnected && isAuthenticated) {
      // Wallet was disconnected manually - clear session and redirect
      clearAuth();
      router.push('/');
    }
  }, [isConnected, isAuthenticated, clearAuth, router]);

  // Handle wallet change
  useEffect(() => {
    if (isConnected && address && isAuthenticated) {
      const storedAuth = useAuthStore.getState();
      if (storedAuth.user?.walletAddress?.toLowerCase() !== address?.toLowerCase()) {
        clearAuth();
        router.push('/');
      }
    }
  }, [isConnected, address, isAuthenticated, clearAuth, router]);

  const { disconnect } = useDisconnect();

  const logout = async () => {
    // Import authService here to avoid circular dependency
    const { authService } = await import('@/services/auth.service');
    await authService.logout();
    disconnect();
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