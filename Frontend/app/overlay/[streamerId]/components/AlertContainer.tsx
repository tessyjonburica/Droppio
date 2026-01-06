'use client';

import { ReactNode } from 'react';

interface AlertContainerProps {
  children: ReactNode;
}

export function AlertContainer({ children }: AlertContainerProps) {
  return (
    <div 
      className="absolute bottom-20 right-10 max-w-md space-y-4 z-[10000]"
      style={{
        position: 'absolute',
        bottom: '80px',
        right: '40px',
        maxWidth: '28rem',
        zIndex: 10000,
        pointerEvents: 'none',
      }}
    >
      {children}
    </div>
  );
}