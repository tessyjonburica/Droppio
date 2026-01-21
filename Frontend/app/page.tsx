'use client';

import { HeroSection } from '@/components/landing/HeroSection';
import { HowItWorks } from '@/components/landing/HowItWorks';
import { CreatorEconomy } from '@/components/landing/CreatorEconomy';
import { SupportedPlatforms } from '@/components/landing/SupportedPlatforms';
import { FooterCTA } from '@/components/landing/FooterCTA';

export default function Home() {
  return (
    <main className="min-h-screen bg-white">
      {/* Hero Section */}
      <HeroSection />

      {/* Social Proof: Supported Platforms */}
      <SupportedPlatforms />

      {/* How It Works Section */}
      <HowItWorks />

      {/* Creator Economy Section */}
      <CreatorEconomy />

      {/* Footer CTA Section (Includes Footer) */}
      <FooterCTA />
    </main>
  );
}
