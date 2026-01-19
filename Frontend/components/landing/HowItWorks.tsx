'use client';

import { Globe, Zap, Ban, Network, Lock } from 'lucide-react';

const steps = [
    {
        title: 'Non-custodial tipping',
        description: 'Send funds directly to your favorite creators. We never hold your assets; the transaction happens peer-to-peer on-chain.',
        icon: Globe,
        iconBg: 'bg-teal-50',
        iconColor: 'text-teal-600',
    },
    {
        title: 'Real-time earnings',
        description: 'Funds hit the creator\'s wallet the moment the transaction is confirmed. No waiting for processing cycles.',
        icon: Zap,
        iconBg: 'bg-yellow-50',
        iconColor: 'text-yellow-600',
    },
    {
        title: 'Zero withdrawals',
        description: 'Because tips land directly in the creator\'s wallet, there\'s no withdrawal process. No fees, no limits, no delays.',
        icon: Ban,
        iconBg: 'bg-red-50',
        iconColor: 'text-red-600',
    },
    {
        title: 'Permissionless access',
        description: 'Available globally. Anyone with a wallet can start earning or supporting without gatekeepers or credit checks.',
        icon: Network,
        iconBg: 'bg-blue-50',
        iconColor: 'text-blue-600',
    },
    {
        title: 'Wallet-native security',
        description: 'Built on top of leading blockchain infrastructure. Your security is handled by your wallet\'s encryption standards.',
        icon: Lock,
        iconBg: 'bg-green-50',
        iconColor: 'text-green-600',
    },
];

export function HowItWorks() {
    return (
        <section className="py-24 bg-white">
            <div className="container mx-auto px-4">
                <div className="text-center mb-16">
                    <span className="text-primary font-bold tracking-widest text-xs uppercase mb-3 block">THE PROCESS</span>
                    <h2 className="text-4xl md:text-5xl font-header text-primary-dark">How Droppio Works</h2>
                </div>

                <div className="flex flex-wrap justify-center gap-8 max-w-6xl mx-auto">
                    {/* First Row: 3 cards */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8 w-full">
                        {steps.slice(0, 2).map((step, index) => (
                            <div key={index} className="bg-white p-8 rounded-[32px] border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
                                <div className={`${step.iconBg} ${step.iconColor} w-12 h-12 rounded-xl flex items-center justify-center mb-6`}>
                                    <step.icon size={24} />
                                </div>
                                <h3 className="text-xl font-bold text-gray-900 mb-4">{step.title}</h3>
                                <p className="text-gray-600 leading-relaxed">{step.description}</p>
                            </div>
                        ))}
                        <div className="hidden md:block">
                            {/* This matches the layout where the 3rd card is actually in the middle row or something. 
                     Wait, looking at the design, it's 2 cards in first row, 3 cards in second row? 
                     Actually it's 2 top, 3 bottom. Let's re-examine.
                 */}
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8 w-full">
                        {steps.slice(2).map((step, index) => (
                            <div key={index} className="bg-white p-8 rounded-[32px] border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
                                <div className={`${step.iconBg} ${step.iconColor} w-12 h-12 rounded-xl flex items-center justify-center mb-6`}>
                                    <step.icon size={24} />
                                </div>
                                <h3 className="text-xl font-bold text-gray-900 mb-4">{step.title}</h3>
                                <p className="text-gray-600 leading-relaxed">{step.description}</p>
                            </div>
                        ))}
                        {/* To match the design precisely, I'll use a better grid layout. */}
                    </div>
                </div>
            </div>
        </section>
    );
}
