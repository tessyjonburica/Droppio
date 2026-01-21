'use client';

import { Globe, Zap, Ban, Network, Lock } from 'lucide-react';

const steps = [
    {
        title: 'Non-custodial tipping',
        description: 'Send funds directly to your favorite creators. We never hold your assets; the transaction happens peer-to-peer on-chain.',
        icon: Globe,
        iconBg: 'bg-[#EBF7F7]',
        iconColor: 'text-[#0F9E99]',
    },
    {
        title: 'Real-time earnings',
        description: 'Funds hit the creator\'s wallet the moment the transaction is confirmed. No waiting for processing cycles.',
        icon: Zap,
        iconBg: 'bg-[#FFF9EB]',
        iconColor: 'text-[#F59E0B]',
    },
    {
        title: 'Zero withdrawals',
        description: 'Because tips land directly in the creator\'s wallet, there\'s no withdrawal process. No fees, no limits, no delays.',
        icon: Ban,
        iconBg: 'bg-[#FEF2F2]',
        iconColor: 'text-[#EF4444]',
    },
    {
        title: 'Permissionless access',
        description: 'Available globally. Anyone with a wallet can start earning or supporting without gatekeepers or credit checks.',
        icon: Network,
        iconBg: 'bg-[#EEF2FF]',
        iconColor: 'text-[#6366F1]',
    },
    {
        title: 'Wallet-native security',
        description: 'Built on top of leading blockchain infrastructure. Your security is handled by your wallet\'s encryption standards.',
        icon: Lock,
        iconBg: 'bg-[#F0FDF4]',
        iconColor: 'text-[#22C55E]',
    },
];

export function HowItWorks() {
    return (
        <section className="py-32 bg-white">
            <div className="container mx-auto px-4">
                <div className="text-center mb-16">
                    <span className="text-primary font-bold tracking-widest text-xs uppercase mb-3 block">THE PROCESS</span>
                    <h2 className="text-4xl md:text-5xl font-header text-primary-dark">How Droppio Works</h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
                    {/* First row: 2 cards */}
                    {(() => {
                        const Step1Icon = steps[0].icon;
                        return (
                            <div className="md:col-span-2 bg-white p-10 rounded-[40px] shadow-[0_4px_20px_rgba(0,0,0,0.02)] border border-white relative overflow-hidden group">
                                <div className={`${steps[0].iconBg} ${steps[0].iconColor} w-10 h-10 rounded-full flex items-center justify-center mb-10`}>
                                    <Step1Icon size={20} />
                                </div>
                                <h3 className="text-2xl font-bold text-[#0D2121] mb-4">{steps[0].title}</h3>
                                <p className="text-[#64748B] leading-relaxed text-lg max-w-2xl">{steps[0].description}</p>
                            </div>
                        );
                    })()}

                    {(() => {
                        const Step2Icon = steps[1].icon;
                        return (
                            <div className="bg-white p-10 rounded-[40px] shadow-[0_4px_20px_rgba(0,0,0,0.02)] border border-white relative overflow-hidden group">
                                <div className={`${steps[1].iconBg} ${steps[1].iconColor} w-10 h-10 rounded-full flex items-center justify-center mb-10`}>
                                    <Step2Icon size={20} />
                                </div>
                                <h3 className="text-2xl font-bold text-[#0D2121] mb-4">{steps[1].title}</h3>
                                <p className="text-[#64748B] leading-relaxed text-lg">{steps[1].description}</p>
                            </div>
                        );
                    })()}

                    {/* Second row: 3 cards */}
                    {steps.slice(2).map((step, index) => {
                        const StepIcon = step.icon;
                        return (
                            <div key={index} className="bg-white p-10 rounded-[40px] shadow-[0_4px_20px_rgba(0,0,0,0.02)] border border-white relative overflow-hidden group">
                                <div className={`${step.iconBg} ${step.iconColor} w-10 h-10 rounded-full flex items-center justify-center mb-10`}>
                                    <StepIcon size={20} />
                                </div>
                                <h3 className="text-2xl font-bold text-[#0D2121] mb-4">{step.title}</h3>
                                <p className="text-[#64748B] leading-relaxed text-lg">{step.description}</p>
                            </div>
                        );
                    })}
                </div>
            </div>
        </section>
    );
}
