'use client';

import { useState, useRef, useEffect } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import { AnimatePresence } from 'framer-motion';
import { overlayService } from '@/services/overlay.service';
import { OverlayContainer } from './components/OverlayContainer';
import { AlertContainer } from './components/AlertContainer';
import { TipAnimation } from './components/TipAnimation';
import { useOverlayWebSocket } from './hooks/useOverlayWebSocket';
import { TipData, OverlayTheme } from './types';

export default function OverlayPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const creatorId = params.streamerId as string;
  const token = searchParams.get('token');

  const [themeName, setThemeName] = useState<OverlayTheme>('default');
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [minAmount, setMinAmount] = useState('0');
  const [currentTips, setCurrentTips] = useState<TipData[]>([]);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Log initialization
  useEffect(() => {
    console.log('[Overlay] Initializing overlay page:', {
      creatorId,
      hasToken: !!token,
      enabled: !!creatorId && !!token,
    });
    
    if (!creatorId) {
      console.error('[Overlay] Missing creatorId in URL');
    }
    if (!token) {
      console.error('[Overlay] Missing token in query string');
    }
  }, [creatorId, token]);

  useEffect(() => {
    const loadConfig = async () => {
      if (!creatorId) return;
      try {
        const config = await overlayService.getConfig(creatorId);
        const fetchedTheme = (config.theme as any)?.name || (typeof config.theme === 'string' ? config.theme : 'default');
        setThemeName(fetchedTheme as OverlayTheme);
        setSoundEnabled(config.alert_settings?.soundEnabled ?? true);
        setMinAmount(config.alert_settings?.minAmount || '0');
      } catch (error) {
        console.error('Failed to load overlay config:', error);
      }
    };
    loadConfig();
  }, [creatorId]);

  // WebSocket connection
  const { isConnected } = useOverlayWebSocket({
    creatorId,
    token: token || '',
    enabled: !!creatorId && !!token,
    onMessage: (event) => {
      if (event.type === 'tip_event') {
        const amount = parseFloat(event.data.amount);
        const threshold = parseFloat(minAmount);
        console.log(`[Overlay] Tip received: ${amount} ETH, threshold: ${threshold} ETH`);
        if (amount >= threshold) {
          handleTipEvent(event.data);
        } else {
          console.log(`[Overlay] Tip filtered out (${amount} < ${threshold})`);
        }
      } else {
        console.log('[Overlay] Unknown event type:', event.type);
      }
    },
  });

  const handleTipEvent = (tipData: TipData) => {
    console.log('[Overlay] Tip event received:', tipData);
    
    // Play sound if enabled
    if (soundEnabled && audioRef.current) {
      audioRef.current.play().catch((error) => {
        console.error('[Overlay] Failed to play sound:', error);
      });
    }

    // Add tip to queue
    setCurrentTips((prev) => {
      const updated = [...prev, tipData];
      console.log('[Overlay] Current tips queue:', updated.length);
      return updated;
    });

    // Auto-remove after animation completes (5.5 seconds)
    setTimeout(() => {
      setCurrentTips((prev) => prev.filter((tip) => tip.tipId !== tipData.tipId));
    }, 5500);
  };

  return (
    <OverlayContainer isConnected={isConnected}>
      {/* Sound element */}
      {soundEnabled && (
        <audio
          ref={audioRef}
          src="/sounds/tip-sound.mp3"
          preload="auto"
          style={{ display: 'none' }}
        />
      )}

      {/* Alert Container */}
      <AlertContainer>
        <AnimatePresence>
          {currentTips.map((tip) => (
            <TipAnimation
              key={tip.tipId}
              tip={tip}
              theme={themeName}
              onComplete={() => {
                setCurrentTips((prev) => prev.filter((t) => t.tipId !== tip.tipId));
              }}
            />
          ))}
        </AnimatePresence>
      </AlertContainer>
    </OverlayContainer>
  );
}
