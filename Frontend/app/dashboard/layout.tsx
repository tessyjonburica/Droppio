'use client';

import { DashboardSidebar } from '@/components/layout/dashboard-sidebar';
import { Header } from '@/components/layout/header';
import { useState } from 'react';
import { Menu, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

    return (
        <div className="flex flex-col min-h-screen bg-[#FDFDFD]">
            <Header />
            <div className="flex-1 flex overflow-hidden">
                {/* Desktop Sidebar */}
                <aside className="hidden md:block w-64 flex-shrink-0">
                    <DashboardSidebar />
                </aside>

                {/* Mobile Sidebar Overlay */}
                {isSidebarOpen && (
                    <div
                        className="fixed inset-0 z-40 bg-black/50 md:hidden"
                        onClick={() => setIsSidebarOpen(false)}
                    />
                )}

                {/* Mobile Sidebar */}
                <aside className={cn(
                    "fixed inset-y-0 left-0 z-50 w-64 bg-white transform transition-transform duration-300 ease-in-out md:hidden",
                    isSidebarOpen ? "translate-x-0" : "-translate-x-full"
                )}>
                    <div className="flex flex-col h-full">
                        <div className="p-4 border-b flex items-center justify-between">
                            <span className="font-logo text-primary text-xl">droppio</span>
                            <Button variant="ghost" size="icon" onClick={() => setIsSidebarOpen(false)}>
                                <X className="h-6 w-6" />
                            </Button>
                        </div>
                        <DashboardSidebar className="border-r-0" />
                    </div>
                </aside>

                {/* Main Content */}
                <main className="flex-1 overflow-y-auto relative">
                    {/* Mobile Header for Sidebar Toggle */}
                    <div className="md:hidden flex items-center p-4 bg-white border-b sticky top-0 z-30">
                        <Button variant="ghost" size="icon" onClick={() => setIsSidebarOpen(true)}>
                            <Menu className="h-6 w-6" />
                        </Button>
                        <span className="ml-4 font-semibold text-lg">Dashboard</span>
                    </div>

                    <div className="p-6 md:p-8 max-w-7xl mx-auto w-full">
                        {children}
                    </div>
                </main>
            </div>
        </div>
    );
}
