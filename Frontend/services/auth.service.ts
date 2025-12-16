import { api } from './api';
import { useAuthStore } from '@/store/auth-store';

export interface LoginInput {
  walletAddress: string;
  signature: string;
  message: string;
  role?: 'viewer' | 'streamer';
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  user: {
    id: string;
    walletAddress: string;
    role: 'viewer' | 'streamer';
    displayName: string | null;
    avatarUrl: string | null;
  };
}

export const authService = {
  async login(data: LoginInput): Promise<AuthResponse> {
    const response = await api.post<AuthResponse>('/auth/login', data);
    const { accessToken, refreshToken, user } = response.data;
    // Normalize backend snake_case to frontend camelCase
    const normalizedUser = {
      id: user.id,
      walletAddress: user.walletAddress,
      role: user.role,
      displayName: user.displayName,
      avatarUrl: user.avatarUrl,
    };
    useAuthStore.getState().setAuth(normalizedUser, accessToken, refreshToken);
    return response.data;
  },

  async refresh(refreshToken: string): Promise<AuthResponse> {
    const response = await api.post<AuthResponse>('/auth/refresh', { refreshToken });
    const { accessToken, refreshToken: newRefreshToken, user } = response.data;
    // Normalize backend snake_case to frontend camelCase
    const normalizedUser = {
      id: user.id,
      walletAddress: user.walletAddress,
      role: user.role,
      displayName: user.displayName,
      avatarUrl: user.avatarUrl,
    };
    useAuthStore.getState().setAuth(normalizedUser, accessToken, newRefreshToken);
    return response.data;
  },

  async logout(): Promise<void> {
    const refreshToken = useAuthStore.getState().refreshToken;
    if (refreshToken) {
      try {
        await api.post('/auth/logout', { refreshToken });
      } catch (error) {
        console.error('Logout error:', error);
      }
    }
    useAuthStore.getState().clearAuth();
  },
};

