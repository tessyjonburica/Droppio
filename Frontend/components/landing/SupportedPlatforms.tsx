'use client';

import { Twitch, Youtube, Instagram, Twitter } from 'lucide-react';

const platforms = [
    { name: 'TWITCH', icon: Twitch },
    { name: 'KICK', icon: null }, // Kick is not in Lucide
    { name: 'YOUTUBE', icon: Youtube },
    { name: 'X', icon: Twitter },
    { name: 'INSTAGRAM', icon: Instagram },
];

export function SupportedPlatforms() {
    return (
        <section className="py-16 bg-white border-t border-gray-50">
            <div className="container mx-auto px-4">
                <div className="text-center mb-10">
                    <span className="text-gray-400 font-bold tracking-[0.2em] text-xs uppercase">SUPPORTED PLATFORMS</span>
                </div>

                <div className="flex flex-wrap items-center justify-center gap-12 md:gap-20 opacity-40">
                    {platforms.map((platform, index) => (
                        <div key={index} className="flex items-center gap-3 group hover:opacity-100 transition-opacity">
                            {platform.icon ? (
                                <platform.icon size={28} className="text-slate-900" />
                            ) : (
                                <div className="font-bold text-2xl tracking-tighter text-slate-900">KICK</div>
                            )}
                            <span className="font-black text-xl text-slate-900 tracking-tight hidden md:block">
                                {platform.name !== 'KICK' ? platform.name : ''}
                            </span>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}
