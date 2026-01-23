'use client';

import { SearchBar } from '@/components/discovery/SearchBar';
import { Button } from '@/components/ui/button';
import { WalletConnect } from '@/components/auth/wallet-connect';
import Link from 'next/link';

export function HeroSection() {
    return (
        <section className="relative px-4 pt-12 pb-24 md:pt-20 md:pb-32 overflow-hidden">
            {/* Background with Teal Gradient and Dot Pattern */}
            <div className="absolute inset-0 z-0 bg-gradient-to-br from-primary-accent via-primary to-primary-accent">
                <div className="absolute inset-0 bg-dot-pattern opacity-20" />
            </div>

            <div className="container relative z-10 mx-auto max-w-6xl rounded-[40px] px-8 py-16 md:px-16 md:py-24 bg-transparent text-white">
                <div className="flex flex-col md:flex-row items-center justify-between gap-12">
                    {/* Left Content */}
                    <div className="max-w-2xl">
                        <div className="flex items-center gap-1 mb-8">
                            <span className="font-header text-3xl md:text-4xl text-white">droppio.</span>
                        </div>

                        <h1 className="font-header text-5xl md:text-7xl leading-tight mb-8 text-white drop-shadow-sm">
                            Discover creators.<br />
                            Tip instantly.<br />
                            Own your support.
                        </h1>

                        <p className="text-lg md:text-xl text-white/90 max-w-md leading-relaxed mb-12">
                            The decentralized home for the streaming generation. Direct support, zero middlemen, pure appreciation.
                        </p>
                    </div>

                    {/* Right Action Buttons */}
                    <div className="flex flex-col gap-4 min-w-[240px] md:mt-12">
                        <Link href="/creator-login" className="w-full">
                            <Button
                                size="lg"
                                className="w-full bg-white text-primary hover:bg-white/90 text-lg font-semibold rounded-2xl h-14"
                            >
                                Become a Creator
                            </Button>
                        </Link>
                        <div className="w-full">
                            <WalletConnect
                                className="w-full bg-white/20 backdrop-blur-md border-white/30 text-white hover:bg-white/30 text-lg font-semibold rounded-2xl h-14"
                            />
                        </div>
                    </div>
                </div>

                {/* Search Bar - Positioned overlapping the bottom */}
                <div id="search-section" className="absolute -bottom-7 left-1/2 -translate-x-1/2 w-full max-w-3xl px-4">
                    <div className="bg-white rounded-full shadow-2xl p-1 flex items-center pr-6">
                        <div className="flex-1">
                            <SearchBar variant="hero" />
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}
