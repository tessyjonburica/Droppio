import { api } from './api';
import { useAuthStore } from '@/store/auth-store';

export interface LoginInput {
  walletAddress: string;
  signature: string;
  message: string;
  role?: 'viewer' | 'creator';
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  user: {
    id: string;
    walletAddress: string;
    role: 'viewer' | 'creator';
    displayName: string | null;
    avatarUrl: string | null;
  };
}

export const authService = {
  async login(data: LoginInput): Promise<AuthResponse> {
    try {
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
    } catch (error: any) {
      console.error('Auth service login error:', error);
      
      // Handle network errors (no response from server)
      if (error.code === 'ERR_NETWORK' || error.code === 'ECONNABORTED' || !error.response) {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
        const errorMessage = error.code === 'ECONNABORTED' 
          ? 'Request timed out. The server is taking too long to respond. Please check if the server is running.'
          : `Unable to connect to the server at ${apiUrl}. Please check your internet connection and ensure the backend server is running on port 5000.`;
        throw new Error(errorMessage);
      }
      
      // Handle HTTP errors (server responded with error status)
      if (error.response) {
        const errorMessage = error.response?.data?.error || error.response?.data?.message || error.message || 'Login failed';
        throw new Error(errorMessage);
      }
      
      // Fallback for any other errors
      throw new Error(error.message || 'Login failed. Please try again.');
    }
  },

  async refresh(refreshToken: string): Promise<AuthResponse> {
    try {
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
    } catch (error: any) {
      console.error('Auth service refresh error:', error);
      
      // Handle network errors (no response from server)
      if (error.code === 'ERR_NETWORK' || error.code === 'ECONNABORTED' || !error.response) {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
        const errorMessage = error.code === 'ECONNABORTED' 
          ? 'Request timed out. The server is taking too long to respond.'
          : `Unable to connect to the server at ${apiUrl}. Please check your internet connection and ensure the backend server is running.`;
        throw new Error(errorMessage);
      }
      
      // Handle HTTP errors (server responded with error status)
      if (error.response) {
        const errorMessage = error.response?.data?.error || error.response?.data?.message || error.message || 'Token refresh failed';
        throw new Error(errorMessage);
      }
      
      // Fallback for any other errors
      throw new Error(error.message || 'Token refresh failed. Please try again.');
    }
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

