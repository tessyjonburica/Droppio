'use client';

import { Button } from '@/components/ui/button';
import Link from 'next/link';

export function FooterCTA() {
    return (
        <footer className="relative bg-primary pt-24 pb-12 overflow-hidden">
            {/* Large Background Text */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none select-none overflow-hidden">
                <span className="text-[20rem] md:text-[30rem] font-black text-white/5 tracking-tighter transform translate-y-12">
                    Droppio
                </span>
            </div>

            <div className="container relative z-10 mx-auto px-4 text-center">
                <h2 className="text-4xl md:text-6xl font-bold text-white mb-12">
                    Ready to become a creator?
                </h2>

                <div className="flex flex-col sm:flex-row items-center justify-center gap-6 mb-24">
                    <Button
                        size="lg"
                        className="bg-primary hover:bg-primary/90 text-white text-lg border border-white/50 font-semibold px-12 py-7 rounded-2xl h-auto"
                        onClick={() => {
                            const element = document.getElementById('search-section');
                            if (element) {
                                element.scrollIntoView({ behavior: 'smooth', block: 'center' });
                                setTimeout(() => {
                                    element.querySelector('input')?.focus();
                                }, 600);
                            }
                        }}
                    >
                        Start Tipping
                    </Button>
                    <Link href="/creator-login">
                        <Button
                            size="lg"
                            variant="outline"
                            className="bg-primary-accent/20 border-white/50 text-white hover:bg-white/10 text-xl font-bold px-12 py-8 rounded-full h-16"
                        >
                            Become a Creator
                        </Button>
                    </Link>
                </div>

                {/* Bottom Bar */}
                <div className="border-t border-white/10 pt-12 flex flex-col md:flex-row items-center justify-between gap-8">
                    <div className="flex items-center gap-2">
                        <span className="font-header text-2xl text-white">droppio.</span>
                    </div>

                    <div className="flex items-center gap-8">
                        <a href="https://x.com/droppiohq" className="text-white/60 hover:text-white transition-colors font-medium">X</a>
                        <a href="https://discord.gg/" className="text-white/60 hover:text-white transition-colors font-medium">Discord</a>
                    </div>

                    <div className="text-white/40 text-sm font-medium">
                        © 2026 Droppio.
                    </div>
                </div>
            </div>
        </footer>
    );
}
