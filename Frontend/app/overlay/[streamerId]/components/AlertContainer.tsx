'use client';

import { ReactNode } from 'react';

interface AlertContainerProps {
  children: ReactNode;
}

export function AlertContainer({ children }: AlertContainerProps) {
  return (
    <div 
      className="absolute top-20 left-1/2 -translate-x-1/2 max-w-md space-y-4 z-[10000]"
      style={{
        position: 'absolute',
        top: '80px',
        left: '50%',
        transform: 'translateX(-50%)',
        maxWidth: '28rem',
        width: '100%',
        zIndex: 10000,
        pointerEvents: 'none',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
      }}
    >
      {children}
    </div>
  );
}