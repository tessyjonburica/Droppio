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
  created_at: Date;
  updated_at: Date;
}

export interface UpdateOverlayInput {
  theme?: OverlayTheme;
  alertSettings?: AlertSettings;
}
