'use client';

const DiscordIcon = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
        <path d="M20.317 4.3698a19.7913 19.7913 0 00-4.8851-1.5152.0741.0741 0 00-.0785.0371c-.211.3753-.4447.8648-.6083 1.2495-1.8447-.2762-3.68-.2762-5.4868 0-.1636-.3933-.4058-.8742-.6177-1.2495a.077.077 0 00-.0785-.037 19.7363 19.7363 0 00-4.8852 1.515.0699.0699 0 00-.0321.0277C.5334 9.0458-.319 13.5799.0992 18.0578a.0824.0824 0 00.0312.0561c2.0528 1.5076 4.0413 2.4228 5.9929 3.0294a.0777.0777 0 00.0842-.0276c.4616-.6304.8731-1.2952 1.226-1.9942a.076.076 0 00-.0416-.1057c-.6528-.2476-1.2743-.5495-1.8722-.8923a.077.077 0 01-.0076-.1277c.1258-.0943.2517-.1923.3718-.2914a.0743.0743 0 01.0776-.0105c3.9278 1.7933 8.18 1.7933 12.0614 0a.0739.0739 0 01.0785.0095c.1202.099.246.1971.3728.2914a.077.077 0 01-.0066.1277 12.2986 12.2986 0 01-1.873.8914.075.075 0 00-.0407.1067c.3604.698.7719 1.3628 1.225 1.9932a.076.076 0 00.0842.0286c1.961-.6067 3.9495-1.5219 6.0023-3.0294a.077.077 0 00.0313-.0552c.5004-5.177-.8382-9.6739-3.5485-13.6604a.061.061 0 00-.0312-.0286zM8.02 15.3312c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9555-2.4189 2.157-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3237-.9555 2.4189-2.1569 2.4189zm7.9748 0c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9554-2.4189 2.1569-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3237-.946 2.4189-2.1568 2.4189z" />
    </svg>
);

export function CreatorEconomy() {
    return (
        <section className="py-32 bg-[#F8FAFB] overflow-hidden min-h-[600px] flex items-center">
            <div className="container mx-auto px-4">
                <div className="flex flex-col lg:flex-row items-center gap-16 max-w-7xl mx-auto">
                    {/* Left: Content */}
                    <div className="w-full lg:w-[40%] text-[#0D2121]">
                        <span className="text-primary font-bold tracking-widest text-xs uppercase mb-3 block">CREATOR ECONOMY</span>
                        <h2 className="text-5xl md:text-7xl font-header font-bold leading-[1.1] mb-12 tracking-tight">
                            Join the community of TOP creators
                        </h2>
                        <a
                            href="https://discord.gg/droppio"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-3 bg-primary hover:bg-primary/90 text-white text-xl font-bold px-8 py-5 rounded-[24px] shadow-xl transition-all hover:scale-105"
                        >
                            <DiscordIcon />
                            Join Now
                        </a>
                    </div>

                    {/* Right: Staggered Card Montage */}
                    <div className="w-full lg:w-[60%] relative">
                        <div className="flex gap-4 md:gap-6 items-start">
                            {/* Column 1 */}
                            <div className="flex flex-col gap-4 md:gap-6 mt-12 w-1/3">
                                <div className="aspect-square bg-white rounded-[40px] overflow-hidden shadow-lg border border-white">
                                    <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=creator1" alt="Creator" className="w-full h-full object-cover" />
                                </div>
                                <div className="bg-[#D9DFF0] p-6 pt-10 rounded-[40px] shadow-xl aspect-[0.85] flex flex-col justify-between relative overflow-hidden group border border-white">
                                    <div className="flex gap-1.5 absolute top-6 left-6">
                                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full border border-[#303642]/10 text-[#303642]">Twitch</span>
                                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full border border-[#303642]/10 text-[#303642]">72 Tips</span>
                                    </div>
                                    <h3 className="text-3xl font-bold text-[#303642]">Alisa</h3>
                                </div>
                                <div className="aspect-square bg-[#E2E8F0] rounded-[40px] overflow-hidden shadow-lg border border-white">
                                    <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=creator3" alt="Creator" className="w-full h-full object-cover" />
                                </div>
                            </div>

                            {/* Column 2 */}
                            <div className="flex flex-col gap-4 md:gap-6 w-1/3">
                                <div className="aspect-square bg-[#F1F5F9] rounded-[40px] overflow-hidden shadow-2xl border border-white">
                                    <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=ape1" alt="Creator" className="w-full h-full object-cover" />
                                </div>
                                <div className="aspect-square bg-[#FB923C] rounded-[40px] overflow-hidden shadow-xl border border-white">
                                    <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=creator4" alt="Creator" className="w-full h-full object-cover" />
                                </div>
                                <div className="aspect-square bg-[#EC4899] rounded-[40px] overflow-hidden shadow-xl border border-white">
                                    <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=creator5" alt="Creator" className="w-full h-full object-cover" />
                                </div>
                            </div>

                            {/* Column 3 */}
                            <div className="flex flex-col gap-4 md:gap-6 mt-24 w-1/3">
                                <div className="aspect-square bg-[#A5B4FC] rounded-[40px] overflow-hidden shadow-xl border border-white">
                                    <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=creator6" alt="Creator" className="w-full h-full object-cover" />
                                </div>
                                <div className="bg-[#FEF08A] p-6 pt-10 rounded-[40px] shadow-xl aspect-[0.85] flex flex-col justify-between relative overflow-hidden group border border-white">
                                    <div className="flex gap-1.5 absolute top-6 left-6">
                                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full border border-[#303642]/10 text-[#303642]">Youtube</span>
                                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full border border-[#303642]/10 text-[#303642]">19 Tips</span>
                                    </div>
                                    <h3 className="text-3xl font-bold text-[#303642]">Slava</h3>
                                </div>
                                <div className="bg-[#5C899D] p-6 pt-10 rounded-[40px] shadow-xl aspect-[0.85] flex flex-col justify-between relative overflow-hidden group border border-white">
                                    <div className="flex gap-1.5 absolute top-6 left-6">
                                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full border border-[#303642]/10 text-[#303642]">X</span>
                                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full border border-[#303642]/10 text-[#303642]">10 Tips</span>
                                    </div>
                                    <h3 className="text-3xl font-bold text-[#303642]">0xdaniel</h3>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}
