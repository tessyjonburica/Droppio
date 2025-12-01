import { z } from 'zod';

export const LoginInputSchema = z.object({
  walletAddress: z.string().regex(/^0x[a-fA-F0-9]{40}$/, 'Invalid wallet address'),
  signature: z.string().min(1, 'Signature required'),
  message: z.string().min(1, 'Message required'),
  role: z.enum(['viewer', 'streamer']).optional(),
});

export type LoginInput = z.infer<typeof LoginInputSchema>;

export const RefreshTokenInputSchema = z.object({
  refreshToken: z.string().min(1, 'Refresh token required'),
});

export type RefreshTokenInput = z.infer<typeof RefreshTokenInputSchema>;

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

