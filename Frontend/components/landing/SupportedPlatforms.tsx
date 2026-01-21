'use client';

import { Twitch, Youtube, Instagram } from 'lucide-react';

const XIcon = ({ size = 24 }: { size?: number }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
        <path d="M18.901 1.153h3.68l-8.04 9.19L24 22.846h-7.406l-5.8-7.584-6.638 7.584H.474l8.6-9.83L0 1.154h7.594l5.243 6.932 6.064-6.932zm-1.292 19.49h2.039L6.486 3.24H4.298l13.311 17.403z" />
    </svg>
);

const platforms = [
    { name: 'TWITCH', icon: Twitch },
    { name: 'KICK', icon: null }, // Kick is not in Lucide
    { name: 'YOUTUBE', icon: Youtube },
    { name: 'X', icon: XIcon },
    { name: 'INSTAGRAM', icon: Instagram },
];

export function SupportedPlatforms() {
    return (
        <section className="py-16 bg-[#F8FAFB] border-t border-gray-50">
            <div className="container mx-auto px-4">
                <div className="text-center mb-10">
                    <span className="text-slate-400 font-bold tracking-[0.2em] text-xs uppercase">SUPPORTED PLATFORMS</span>
                </div>

                <div className="flex flex-wrap items-center justify-center gap-12 md:gap-20 opacity-40">
                    {platforms.map((platform, index) => (
                        <div key={index} className="flex items-center gap-3 group hover:opacity-100 transition-opacity">
                            {platform.icon ? (
                                <platform.icon size={platform.name === 'X' ? 24 : 28} className="text-slate-900" />
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
