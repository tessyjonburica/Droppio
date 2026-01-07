'use client';

import { useEffect } from 'react';
import { motion } from 'framer-motion';
import { TipData, OverlayTheme } from '../types';
import { themes } from '../styles/themes';

interface TipAnimationProps {
  tip: TipData;
  theme: OverlayTheme;
  onComplete: () => void;
}

export function TipAnimation({ tip, theme, onComplete }: TipAnimationProps) {
  const themeConfig = themes[theme];

  const getAnimationVariants = () => {
    switch (themeConfig.animation) {
      case 'bounce':
        return {
          initial: { opacity: 0, y: 100, scale: 0.8 },
          animate: { opacity: 1, y: 0, scale: 1 },
          exit: { opacity: 0, y: -100, scale: 0.8 },
          transition: {
            type: 'spring',
            stiffness: 300,
            damping: 20,
          },
        };
      case 'fade':
        return {
          initial: { opacity: 0 },
          animate: { opacity: 1 },
          exit: { opacity: 0 },
          transition: { duration: 0.3 },
        };
      case 'slide':
      default:
        return {
          initial: { opacity: 0, y: -100, scale: 0.9 },
          animate: { opacity: 1, y: 0, scale: 1 },
          exit: { opacity: 0, y: -50, scale: 0.9 },
          transition: { type: 'spring', stiffness: 300, damping: 25 },
        };
    }
  };

  const variants = getAnimationVariants();

  // Auto-dismiss after 5 seconds (use useEffect to avoid multiple timeouts)
  useEffect(() => {
    const timer = setTimeout(() => {
      onComplete();
    }, 5000);
    return () => clearTimeout(timer);
  }, [onComplete]);

  return (
    <motion.div
      initial={variants.initial}
      animate={variants.animate}
      exit={variants.exit}
      transition={variants.transition}
      className="relative"
      style={{ 
        pointerEvents: 'none',
        zIndex: 10000,
        position: 'relative',
        visibility: 'visible',
        opacity: 1,
      }}
    >
      <div
        className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-2xl p-6 border-2"
        style={{
          backgroundColor: themeConfig.backgroundColor || 'rgba(255, 255, 255, 0.95)',
          borderColor: themeConfig.borderColor || '#0F9E99',
          color: themeConfig.textColor || '#000000',
          minWidth: '320px',
          maxWidth: '400px',
          visibility: 'visible',
          opacity: 1,
          margin: '0 auto',
        }}
      >
        <div className="flex items-center gap-4">
          {/* Icon */}
          <div
            className="w-16 h-16 rounded-full flex items-center justify-center flex-shrink-0"
            style={{ backgroundColor: `${themeConfig.primaryColor}20` }}
          >
            <motion.div
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ duration: 0.5, repeat: Infinity, repeatDelay: 1 }}
            >
              <span className="text-3xl">💰</span>
            </motion.div>
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              <p
                className="font-bold text-2xl mb-1 truncate"
                style={{ color: themeConfig.primaryColor }}
              >
                {tip.amount} ETH
              </p>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <p className="text-sm opacity-80 truncate">
                from{' '}
                <span className="font-semibold">
                  {tip.viewer.displayName ||
                    `${tip.viewer.walletAddress.slice(0, 6)}...${tip.viewer.walletAddress.slice(-4)}`}
                </span>
              </p>
            </motion.div>
          </div>
        </div>

        {/* Confetti effect for gaming theme */}
        {theme === 'gaming' && (
          <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-2xl">
            {[...Array(20)].map((_, i) => (
              <motion.div
                key={i}
                className="absolute w-2 h-2 rounded-full"
                style={{
                  backgroundColor: themeConfig.primaryColor,
                  left: `${Math.random() * 100}%`,
                  top: `${Math.random() * 100}%`,
                }}
                initial={{ opacity: 0, y: 0, scale: 0 }}
                animate={{
                  opacity: [0, 1, 0],
                  y: -100,
                  scale: [0, 1, 0],
                }}
                transition={{
                  duration: 2,
                  delay: Math.random() * 0.5,
                  repeat: 0,
                }}
              />
            ))}
          </div>
        )}
      </div>
    </motion.div>
  );
}