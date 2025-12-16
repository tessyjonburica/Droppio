'use client';

import { useEffect } from 'react';
import { useAccount } from 'wagmi';
import { useAuthStore } from '@/store/auth-store';
import { authService } from '@/services/auth.service';
import { useRouter } from 'next/navigation';

export function useAuth() {
  const { address, isConnected } = useAccount();
  const { user, isAuthenticated, clearAuth } = useAuthStore();
  const router = useRouter();

  // Auto-login on wallet connect (for creators only)
  // Viewers don't need to login
  useEffect(() => {
    if (isConnected && address && !isAuthenticated) {
      // Check if we have stored auth data for this wallet
      const storedAuth = useAuthStore.getState();
      if (storedAuth.user?.walletAddress === address && storedAuth.accessToken) {
        // User already logged in with this wallet, restore session
        // This handles page refreshes
        return;
      }
      // Auto-login is handled by login form component
      // Don't auto-login viewers - they should tip without auth
    }
  }, [isConnected, address, isAuthenticated]);

  const logout = async () => {
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

