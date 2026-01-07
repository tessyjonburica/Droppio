import { api } from './api';

export interface OverlayTheme {
  primaryColor?: string;
  secondaryColor?: string;
  fontFamily?: string;
  fontSize?: number;
  animationStyle?: string;
}

export interface AlertSettings {
  enabled: boolean;
  soundEnabled?: boolean;
  minAmount?: string;
  showDuration?: number;
}

export interface Overlay {
  id: string;
  creator_id: string;
  theme: OverlayTheme;
  alert_settings: AlertSettings;
  created_at: string;
  updated_at: string;
}

export interface UpdateOverlayInput {
  theme?: OverlayTheme;
  alertSettings?: AlertSettings;
}

export const overlayService = {
  async getConfig(streamerId: string): Promise<Overlay> {
    try {
      const response = await api.get<{ overlay: Overlay } | Overlay>(`/overlay/${streamerId}/config`);
      // Handle both response formats: { overlay: ... } or direct Overlay
      return 'overlay' in response.data ? response.data.overlay : response.data as Overlay;
    } catch (error: any) {
      // If config load fails (e.g., expired token), return defaults instead of throwing
      // The overlay should still work without config
      console.warn('[Overlay Service] Failed to load config, using defaults:', error.message);
      throw error; // Re-throw so caller can handle gracefully
    }
  },

  async updateConfig(streamerId: string, data: UpdateOverlayInput): Promise<Overlay> {
    try {
      const response = await api.patch<{ overlay: Overlay } | Overlay>(`/overlay/${streamerId}/config`, data);
      // Handle both response formats: { overlay: ... } or direct Overlay
      if ('overlay' in response.data) {
        return response.data.overlay;
      }
      return response.data as Overlay;
    } catch (error: any) {
      // Provide better error messages
      if (error.response?.status === 403) {
        const errorMsg = error.response?.data?.error || 'Permission denied';
        const details = error.response?.data?.details || '';
        throw new Error(`${errorMsg}${details ? `: ${details}` : ''}`);
      }
      throw error;
    }
  },
};

