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
      let tipData: TipData | null = null;
      let amount: number;

      // Handle tip_event (from tip.service.ts)
      if (event.type === 'tip_event' && event.data) {
        tipData = event.data;
        amount = parseFloat(tipData.amount);
      }
      // Handle TIP_SENT (from blockchain listener)
      else if (event.type === 'TIP_SENT') {
        // Transform TIP_SENT event to TipData format
        const amountValue = event.amountEth || event.amount || '0';
        amount = parseFloat(amountValue);
        
        // Use txHash as tipId for uniqueness, fallback to timestamp with random
        const uniqueId = event.txHash 
          ? `${event.txHash}-${Date.now()}` 
          : `tip-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        
        tipData = {
          tipId: event.tipId || uniqueId,
          amount: amountValue,
          viewer: event.viewer || {
            displayName: null,
            walletAddress: event.tipperAddress || '',
          },
          timestamp: event.timestamp || new Date().toISOString(),
        };
      } else {
        console.log('[Overlay] Unknown event type:', event.type);
        return;
      }

      if (!tipData) {
        console.error('[Overlay] Failed to extract tip data from event');
        return;
      }

      const threshold = parseFloat(minAmount);
      console.log(`[Overlay] Tip received: ${amount} ETH, threshold: ${threshold} ETH`);
      
      if (amount >= threshold) {
        handleTipEvent(tipData);
      } else {
        console.log(`[Overlay] Tip filtered out (${amount} < ${threshold})`);
      }
    },
  });

  const handleTipEvent = (tipData: TipData) => {
    console.log('[Overlay] Tip event received:', tipData);
    
    // Play sound if enabled (gracefully handle missing file)
    if (soundEnabled && audioRef.current) {
      // Check if audio is ready to play
      if (audioRef.current.readyState >= 2) { // HAVE_CURRENT_DATA or higher
        audioRef.current.play().catch((error) => {
          // Silently fail - audio file might not exist or be blocked
          console.warn('[Overlay] Could not play sound (this is OK if sound file is missing):', error.message);
        });
      } else {
        // Audio not loaded yet, wait for it
        audioRef.current.addEventListener('canplay', () => {
          audioRef.current?.play().catch(() => {
            // Silently fail
          });
        }, { once: true });
      }
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
      {/* Sound element - only render if sound is enabled */}
      {soundEnabled && (
        <audio
          ref={audioRef}
          src="/sounds/tip-sound.mp3"
          preload="auto"
          style={{ display: 'none' }}
          onError={(e) => {
            // Silently handle missing audio file - it's optional
            console.warn('[Overlay] Audio file not found (this is OK):', e);
          }}
        />
      )}

      {/* Debug info in development */}
      {process.env.NODE_ENV === 'development' && (
        <div className="absolute top-20 right-4 bg-black/70 text-white px-3 py-2 rounded text-xs font-mono z-50">
          <div>Tips in queue: {currentTips.length}</div>
          <div>Connected: {isConnected ? 'Yes' : 'No'}</div>
          {currentTips.length > 0 && (
            <div className="mt-2">
              Latest: {currentTips[currentTips.length - 1].amount} ETH
            </div>
          )}
        </div>
      )}

      {/* Alert Container */}
      <AlertContainer>
        <AnimatePresence mode="popLayout" initial={false}>
          {currentTips.map((tip) => {
            console.log('[Overlay] Rendering tip animation:', tip.tipId, tip.amount);
            return (
              <TipAnimation
                key={tip.tipId}
                tip={tip}
                theme={themeName}
                onComplete={() => {
                  console.log('[Overlay] Tip animation completed:', tip.tipId);
                  setCurrentTips((prev) => prev.filter((t) => t.tipId !== tip.tipId));
                }}
              />
            );
          })}
        </AnimatePresence>
      </AlertContainer>

      {/* Test element to verify overlay is visible - always show in dev */}
      {process.env.NODE_ENV === 'development' && (
        <div 
          className="fixed bottom-10 left-10 bg-blue-500 text-white px-4 py-2 rounded z-[10001] font-bold"
          style={{ zIndex: 10001, pointerEvents: 'auto' }}
        >
          OVERLAY ACTIVE - Tips: {currentTips.length} | Connected: {isConnected ? 'YES' : 'NO'}
        </div>
      )}

      {/* Simple test tip animation (always visible in dev when tips exist) */}
      {process.env.NODE_ENV === 'development' && currentTips.length > 0 && (
        <div 
          className="fixed top-10 left-10 bg-green-500 text-white px-4 py-2 rounded z-[10002]"
          style={{ zIndex: 10002 }}
        >
          ✓ Tip received: {currentTips[currentTips.length - 1].amount} ETH
        </div>
      )}
    </OverlayContainer>
  );
}
