import type { Metadata } from 'next';
import { Inter, Pacifico } from 'next/font/google';
import './globals.css';
import { Providers } from './providers';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

const pacifico = Pacifico({
  weight: '400',
  subsets: ['latin'],
  variable: '--font-pacifico',
  display: 'swap',
});

export const metadata: Metadata = {
  title: {
    default: 'droppio',
    template: '%s | droppio',
  },
  description: 'Wallet-based streaming platform - Support creators with crypto tips',
  keywords: ['streaming', 'crypto', 'tips', 'blockchain', 'web3'],
  authors: [{ name: 'Droppio' }],
  creator: 'Droppio',
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://droppio.xyz',
    siteName: 'droppio',
    title: 'droppio',
    description: 'Wallet-based streaming platform - Support creators with crypto tips',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'droppio',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'droppio',
    description: 'Wallet-based streaming platform - Support creators with crypto tips',
    images: ['/og-image.png'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  verification: {
    // Add verification codes when available
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${inter.variable} ${pacifico.variable}`}>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
