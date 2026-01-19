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

      {/* How It Works Section */}
      <div className="mt-12">
        <HowItWorks />
      </div>

      {/* Creator Economy Section */}
      <CreatorEconomy />

      {/* Supported Platforms Section */}
      <SupportedPlatforms />

      {/* Footer CTA Section (Includes Footer) */}
      <FooterCTA />
    </main>
  );
}
