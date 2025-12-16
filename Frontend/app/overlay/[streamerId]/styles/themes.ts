import { OverlayTheme } from '../types';

export const themes: Record<OverlayTheme, {
  primaryColor: string;
  backgroundColor: string;
  textColor: string;
  borderColor: string;
  animation: 'slide' | 'bounce' | 'fade';
}> = {
  default: {
    primaryColor: '#0F9E99',
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    textColor: '#000000',
    borderColor: '#0F9E99',
    animation: 'slide',
  },
  neon: {
    primaryColor: '#00FF88',
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    textColor: '#FFFFFF',
    borderColor: '#00FF88',
    animation: 'bounce',
  },
  minimal: {
    primaryColor: '#FFFFFF',
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    textColor: '#FFFFFF',
    borderColor: '#FFFFFF',
    animation: 'fade',
  },
  gaming: {
    primaryColor: '#FF6B35',
    backgroundColor: 'rgba(255, 107, 53, 0.9)',
    textColor: '#FFFFFF',
    borderColor: '#FFD23F',
    animation: 'bounce',
  },
};