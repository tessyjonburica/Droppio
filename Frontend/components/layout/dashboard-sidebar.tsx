'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import {
    LayoutGrid,
    Settings,
    Video,
    Clock,
    BookOpen
} from 'lucide-react';

interface SidebarProps {
    className?: string;
}

export function DashboardSidebar({ className }: SidebarProps) {
    const pathname = usePathname();

    const routes = [
        {
            label: 'Overview',
            icon: LayoutGrid,
            href: '/dashboard',
            active: pathname === '/dashboard',
        },
        {
            label: 'Stream History',
            icon: Clock,
            href: '/dashboard/history',
            active: pathname === '/dashboard/history',
            soon: true,
        },
        {
            label: 'Overlay Settings',
            icon: Video,
            href: '/dashboard/overlay-settings',
            active: pathname === '/dashboard/overlay-settings',
        },
        {
            label: 'Settings',
            icon: Settings,
            href: '/dashboard/settings',
            active: pathname === '/dashboard/settings',
        },
    ];

    return (
        <div className={cn("h-full flex flex-col bg-white border-r border-slate-100", className)}>
            <div className="flex-1 py-8 px-4">
                <div className="space-y-2">
                    {routes.map((route) => (
                        <Link
                            key={route.href}
                            href={route.soon ? '#' : route.href}
                            className={cn(
                                "group flex items-center gap-3 px-4 py-3.5 rounded-2xl text-sm font-semibold transition-all duration-200",
                                route.active
                                    ? "bg-[#F1F9F9] text-primary"
                                    : "text-slate-500 hover:bg-slate-50 hover:text-slate-900",
                                route.soon && "opacity-60 cursor-not-allowed"
                            )}
                        >
                            <route.icon className={cn("h-5 w-5", route.active ? "text-primary" : "text-slate-400 group-hover:text-slate-600")} />
                            <span className="flex-1">{route.label}</span>
                            {route.soon && (
                                <span className="text-[9px] font-black uppercase tracking-widest bg-slate-100 text-slate-400 px-2 py-1 rounded-full leading-none">
                                    SOON
                                </span>
                            )}
                        </Link>
                    ))}
                </div>
            </div>

            <div className="mt-auto p-6 space-y-4">
                <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-4">RESOURCES</div>
                <Link
                    href="https://docs.droppio.xyz"
                    target="_blank"
                    className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold text-slate-500 hover:text-primary transition-colors"
                >
                    <BookOpen className="h-5 w-5 text-slate-400" />
                    Documentation
                </Link>
            </div>
        </div>
    );
}
