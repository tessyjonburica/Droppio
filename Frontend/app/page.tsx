'use client';

import { Header } from '@/components/layout/header';
import { Logo } from '@/components/brand/logo';
import { Button } from '@/components/ui/button';
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Zap, Shield, Heart } from 'lucide-react';
import Link from 'next/link';
import { SearchBar } from '@/components/discovery/SearchBar';
import { FeaturedCreators } from '@/components/discovery/FeaturedCreators';

export default function Home() {
  return (
    <>
      <Header />
      <main className="min-h-screen bg-white">
        {/* Hero Section */}
        <section className="bg-gradient-to-b from-soft-mint to-white py-20">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto text-center">
              <Logo className="text-6xl mb-6" />
              <h1 className="font-header text-5xl md:text-6xl text-primary mb-6">
                Support Creators with Crypto Tips
              </h1>
              <p className="font-body text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
                The Web3 tipping platform for streamers. Receive tips in ETH on Base network,
                with real-time alerts and seamless integration.
              </p>

              {/* Search Bar Component */}
              <SearchBar />

              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link href="/creator-login" className="w-full sm:w-auto">
                  <Button size="lg" className="text-lg px-8 w-full">
                    Become a Creator
                  </Button>
                </Link>
                <button
                  onClick={() => {
                    document.getElementById('featured-creators')?.scrollIntoView({ behavior: 'smooth' });
                  }}
                  className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-lg font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-11 px-8 w-full sm:w-auto"
                >
                  Browse Creators
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* How It Works */}
        <section className="py-20 bg-white">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto">
              <h2 className="font-header text-4xl text-center text-primary mb-12">
                How It Works
              </h2>
              <div className="grid md:grid-cols-3 gap-8">
                <Card>
                  <CardHeader>
                    <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mb-4">
                      <Zap className="h-6 w-6 text-primary" />
                    </div>
                    <CardTitle>Connect Wallet</CardTitle>
                    <CardDescription>
                      Creators connect their wallet and set up their profile in seconds
                    </CardDescription>
                  </CardHeader>
                </Card>

                <Card>
                  <CardHeader>
                    <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mb-4">
                      <Heart className="h-6 w-6 text-primary" />
                    </div>
                    <CardTitle>Receive Tips</CardTitle>
                    <CardDescription>
                      Viewers send tips in ETH directly to creators, live or offline
                    </CardDescription>
                  </CardHeader>
                </Card>

                <Card>
                  <CardHeader>
                    <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mb-4">
                      <Shield className="h-6 w-6 text-primary" />
                    </div>
                    <CardTitle>Secure & Transparent</CardTitle>
                    <CardDescription>
                      All transactions are on-chain, verified, and immutable
                    </CardDescription>
                  </CardHeader>
                </Card>
              </div>
            </div>
          </div>
        </section>

        {/* Featured Creators Component */}
        <FeaturedCreators />

        {/* CTA Section */}
        <section className="py-20 bg-primary text-white">
          <div className="container mx-auto px-4 text-center">
            <h2 className="font-header text-4xl mb-6">Ready to Start Tipping?</h2>
            <p className="text-xl mb-8 opacity-90 max-w-2xl mx-auto">
              Join the Web3 tipping revolution. Support your favorite creators with instant,
              on-chain tips powered by Base network.
            </p>
            <Link href="/creator-login">
              <Button size="lg" variant="secondary" className="text-lg px-8">
                Get Started Now
              </Button>
            </Link>
          </div>
        </section>
      </main>
    </>
  );
}
