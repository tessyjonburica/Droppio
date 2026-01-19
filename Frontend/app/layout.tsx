import type { Metadata } from 'next';
import { Inter, Lobster } from 'next/font/google';
import './globals.css';
import { Providers } from './providers';
import { Analytics } from "@vercel/analytics/react"
import { SpeedInsights } from "@vercel/speed-insights/next"

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

const lobster = Lobster({
  weight: '400',
  subsets: ['latin'],
  variable: '--font-lobster',
  display: 'swap',
});

export const metadata: Metadata = {
  title: {
    default: 'droppio',
    template: '%s | droppio',
  },
  description: 'Micro Tipping platform - Support creators with crypto tips',
  keywords: ['Content creator', 'crypto', 'tips', 'blockchain', 'web3'],
  authors: [{ name: 'Droppio' }],
  creator: 'Droppio',
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://droppio.xyz',
    siteName: 'droppio',
    title: 'droppio',
    description: 'Micro Tipping platform - Support creators with crypto tips',
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
    description: 'Micro Tipping platform - Support creators with crypto tips',
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
    <html lang="en" className={`${inter.variable} ${lobster.variable}`}>
      <body>
        <Providers>{children}</Providers>
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
