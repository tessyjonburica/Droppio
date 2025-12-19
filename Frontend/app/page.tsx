'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Header } from '@/components/layout/header';
import { Logo } from '@/components/brand/logo';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { creatorService, FeaturedCreator } from '@/services/creator.service';
import { Search, TrendingUp, Zap, Shield, Heart } from 'lucide-react';
import Link from 'next/link';

export default function Home() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [featuredCreators, setFeaturedCreators] = useState<FeaturedCreator[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showResults, setShowResults] = useState(false);

  const searchRef = useRef<HTMLDivElement | null>(null);

  // Load featured creators on mount
  useEffect(() => {
    const loadFeatured = async () => {
      try {
        const creators = await creatorService.getFeaturedCreators(8);
        setFeaturedCreators(creators);
      } catch (error) {
        console.error('Failed to load featured creators:', error);
      }
    };
    loadFeatured();
  }, []);

  // Debounced search
  const performSearch = useCallback(
    async (query: string) => {
      if (!query.trim()) {
        setSearchResults([]);
        setShowResults(false);
        return;
      }

      setIsSearching(true);
      try {
        const results = await creatorService.searchCreators(query);
        setSearchResults(results);
        setShowResults(true);
      } catch (error) {
        console.error('Search failed:', error);
        setSearchResults([]);
      } finally {
        setIsSearching(false);
      }
    },
    []
  );

  useEffect(() => {
    const timer = setTimeout(() => {
      performSearch(searchQuery);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery, performSearch]);

  // Close search results when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowResults(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleCreatorClick = (username: string) => {
    router.push(`/creator/${username}`);
    setShowResults(false);
    setSearchQuery('');
  };

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

              {/* Search Bar */}
              <div className="relative max-w-2xl mx-auto mb-8" ref={searchRef}>
                <div className="relative">
                  <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-muted-foreground h-5 w-5" />
                  <Input
                    type="text"
                    placeholder="Search creators by username, wallet, or platform..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onFocus={() => {
                      if (searchResults.length > 0) setShowResults(true);
                    }}
                    className="pl-12 h-14 text-lg"
                  />
                </div>

                {/* Search Results Dropdown */}
                {showResults && (
                  <div className="absolute top-full left-0 right-0 mt-2 bg-white border rounded-lg shadow-lg z-50 max-h-96 overflow-y-auto">
                    {isSearching ? (
                      <div className="p-4 text-center text-muted-foreground">Searching...</div>
                    ) : searchResults.length > 0 ? (
                      <div className="py-2">
                        {searchResults.map((creator) => (
                          <button
                            key={creator.id}
                            onClick={() => handleCreatorClick(creator.display_name || creator.wallet_address)}
                            className="w-full px-4 py-3 hover:bg-soft-mint text-left flex items-center gap-3 transition-colors"
                          >
                            {creator.avatar_url ? (
                              <img
                                src={creator.avatar_url}
                                alt={creator.display_name || 'Creator'}
                                className="w-10 h-10 rounded-full"
                              />
                            ) : (
                              <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                                <span className="text-primary font-bold">
                                  {(creator.display_name || 'C')[0].toUpperCase()}
                                </span>
                              </div>
                            )}
                            <div className="flex-1 min-w-0">
                              <p className="font-medium truncate">
                                {creator.display_name || `${creator.wallet_address.slice(0, 6)}...${creator.wallet_address.slice(-4)}`}
                              </p>
                              {creator.platform && (
                                <p className="text-sm text-muted-foreground">{creator.platform}</p>
                              )}
                            </div>
                          </button>
                        ))}
                      </div>
                    ) : (
                      <div className="p-4 text-center text-muted-foreground">
                        No creators found
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div className="flex gap-4 justify-center">
                <Link href="/creator-login">
                  <Button size="lg" className="text-lg px-8">
                    Become a Creator
                  </Button>
                </Link>
                <button 
                  onClick={() => {
                    document.getElementById('featured-creators')?.scrollIntoView({ behavior: 'smooth' });
                  }}
                  className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-lg font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-11 px-8"
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

        {/* Featured Creators */}
        {featuredCreators.length > 0 && (
          <section className="py-20 bg-soft-mint">
            <div className="container mx-auto px-4">
              <div className="max-w-6xl mx-auto">
                <div className="flex items-center gap-3 mb-8">
                  <TrendingUp className="h-6 w-6 text-primary" />
                  <h2 className="font-header text-4xl text-primary">
                    Featured Creators
                  </h2>
                </div>
                <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
                  {featuredCreators.map((creator) => (
                    <Link
                      key={creator.id}
                      href={`/creator/${creator.display_name || creator.wallet_address}`}
                    >
                      <Card className="hover:shadow-lg transition-shadow cursor-pointer h-full">
                        <CardHeader>
                          <div className="flex items-center gap-4 mb-4">
                            {creator.avatar_url ? (
                              <img
                                src={creator.avatar_url}
                                alt={creator.display_name || 'Creator'}
                                className="w-16 h-16 rounded-full"
                              />
                            ) : (
                              <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center">
                                <span className="text-2xl text-primary font-bold">
                                  {(creator.display_name || 'C')[0].toUpperCase()}
                                </span>
                              </div>
                            )}
                            <div className="flex-1 min-w-0">
                              <CardTitle className="text-lg truncate">
                                {creator.display_name || `${creator.wallet_address.slice(0, 6)}...`}
                              </CardTitle>
                              {creator.platform && (
                                <CardDescription>{creator.platform}</CardDescription>
                              )}
                            </div>
                          </div>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-1">
                            <p className="text-sm text-muted-foreground">Total Tips</p>
                            <p className="text-2xl font-bold text-primary">
                              {parseFloat(creator.total_tips).toFixed(2)} ETH
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {creator.total_tips_count} tip{creator.total_tips_count !== 1 ? 's' : ''}
                            </p>
                          </div>
                        </CardContent>
                      </Card>
                    </Link>
                  ))}
                </div>
              </div>
            </div>
          </section>
        )}

        {/* CTA Section */}
        <section className="py-20 bg-primary text-white">
          <div className="container mx-auto px-4 text-center">
            <h2 className="font-header text-4xl mb-6">Ready to Start Tipping?</h2>
            <p className="text-xl mb-8 opacity-90 max-w-2xl mx-auto">
              Join the Web3 tipping revolution. Support your favorite creators with instant, 
              on-chain tips powered by Base network.
            </p>
            <Link href="/login">
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
