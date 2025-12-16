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
  streamer_id: string;
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
    const response = await api.get<Overlay>(`/overlay/${streamerId}/config`);
    return response.data;
  },

  async updateConfig(streamerId: string, data: UpdateOverlayInput): Promise<Overlay> {
    const response = await api.patch<Overlay>(`/overlay/${streamerId}/config`, data);
    return response.data;
  },
};

