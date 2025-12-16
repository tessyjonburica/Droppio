'use client';

import { ReactNode } from 'react';

interface AlertContainerProps {
  children: ReactNode;
}

export function AlertContainer({ children }: AlertContainerProps) {
  return (
    <div className="absolute bottom-20 right-10 max-w-md space-y-4">
      {children}
    </div>
  );
}