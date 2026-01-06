'use client';

import { ReactNode } from 'react';

interface OverlayContainerProps {
  children: ReactNode;
  isConnected?: boolean;
}

export function OverlayContainer({ children, isConnected }: OverlayContainerProps) {
  return (
    <div 
      className="fixed inset-0 pointer-events-none z-[9999] overflow-visible"
      style={{ 
        backgroundColor: 'transparent',
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        width: '100vw',
        height: '100vh',
      }}
    >
      {children}

      {/* Connection Status (development only) */}
      {process.env.NODE_ENV === 'development' && (
        <div 
          className={`absolute top-4 right-4 px-3 py-1 rounded text-xs font-mono ${
            isConnected 
              ? 'bg-green-500/80 text-white' 
              : 'bg-red-500/80 text-white'
          }`}
        >
          {isConnected ? '✓ Overlay Connected' : '✗ Overlay Disconnected'}
        </div>
      )}
    </div>
  );
}