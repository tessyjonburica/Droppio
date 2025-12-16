'use client';

import { ReactNode } from 'react';

interface OverlayContainerProps {
  children: ReactNode;
  isConnected?: boolean;
}

export function OverlayContainer({ children, isConnected }: OverlayContainerProps) {
  return (
    <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden bg-transparent">
      {children}

      {/* Connection Status (development only) */}
      {process.env.NODE_ENV === 'development' && (
        <div className="absolute top-4 right-4 bg-black/50 text-white px-3 py-1 rounded text-xs">
          {isConnected ? 'Connected' : 'Disconnected'}
        </div>
      )}
    </div>
  );
}