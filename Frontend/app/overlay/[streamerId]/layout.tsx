import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Droppio Overlay',
  description: 'Live tip overlay for streaming',
  robots: {
    index: false,
    follow: false,
  },
};

export default function OverlayLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}

