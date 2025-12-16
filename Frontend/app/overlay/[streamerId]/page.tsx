'use client';

import { useState, useRef } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import { AnimatePresence } from 'framer-motion';
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
  const theme: OverlayTheme = 'default'; // Always use default theme
  const soundEnabled = true; // Sound always on

  const [currentTips, setCurrentTips] = useState<TipData[]>([]);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // WebSocket connection
  const { isConnected } = useOverlayWebSocket({
    creatorId,
    token: token || '',
    enabled: !!creatorId && !!token,
    onMessage: (event) => {
      if (event.type === 'tip_event') {
        handleTipEvent(event.data);
      }
    },
  });

  const handleTipEvent = (tipData: TipData) => {
    // Play sound if enabled
    if (soundEnabled && audioRef.current) {
      audioRef.current.play().catch((error) => {
        console.error('Failed to play sound:', error);
      });
    }

    // Add tip to queue
    setCurrentTips((prev) => [...prev, tipData]);

    // Auto-remove after animation completes (5 seconds)
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
              theme={theme}
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
