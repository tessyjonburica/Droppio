'use client';

import { Button } from '@/components/ui/button';
import Link from 'next/link';

export function CreatorEconomy() {
    return (
        <section className="py-24 bg-white overflow-hidden">
            <div className="container mx-auto px-4">
                <div className="flex flex-col lg:flex-row items-center gap-12 max-w-6xl mx-auto">
                    {/* Left: Dark CTA Card */}
                    <div className="w-full lg:w-1/2 bg-slate-900 rounded-[40px] p-12 md:p-16 text-white shadow-2xl relative overflow-hidden group">
                        {/* Subtle Gradient Overlay */}
                        <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-transparent opacity-50 group-hover:opacity-70 transition-opacity" />

                        <div className="relative z-10">
                            <h2 className="text-4xl md:text-5xl font-bold leading-tight mb-8">
                                Join the fastest-growing creator economy
                            </h2>
                            <Link href="/creator-login">
                                <Button
                                    size="lg"
                                    className="bg-primary hover:bg-primary/90 text-white text-lg font-semibold px-8 py-6 rounded-2xl flex items-center gap-2 group"
                                >
                                    Get Started Now
                                    <span className="text-xl group-hover:translate-x-1 transition-transform">→</span>
                                </Button>
                            </Link>
                        </div>
                    </div>

                    {/* Right: Avatar Montage Placeholder */}
                    <div className="w-full lg:w-1/2 relative min-h-[400px]">
                        {/* 
                This will be a visually appealing montage of avatars.
                Using CSS shapes and relative positioning to mimic the cluster in the design.
             */}
                        <div className="grid grid-cols-3 gap-4 md:gap-6 animate-in fade-in slide-in-from-right-8 duration-1000">
                            {[...Array(9)].map((_, i) => (
                                <div
                                    key={i}
                                    className={`aspect-square rounded-[30px] overflow-hidden shadow-lg transition-transform hover:scale-105 duration-300 ${i % 2 === 0 ? 'bg-teal-50' : 'bg-slate-100'
                                        } ${i === 4 ? 'scale-110 z-10' : ''}`}
                                >
                                    <img
                                        src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${i + 42}`}
                                        alt={`Creator ${i + 1}`}
                                        className="w-full h-full object-cover"
                                    />
                                </div>
                            ))}
                        </div>
                        {/* Floating decorative elements if needed */}
                    </div>
                </div>
            </div>
        </section>
    );
}
