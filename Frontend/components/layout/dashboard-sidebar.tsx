'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import {
    LayoutDashboard,
    Settings,
    Video,
    History,
    ExternalLink,
    Wallet,
    Zap
} from 'lucide-react';

interface SidebarProps {
    className?: string;
}

export function DashboardSidebar({ className }: SidebarProps) {
    const pathname = usePathname();

    const routes = [
        {
            label: 'Overview',
            icon: LayoutDashboard,
            href: '/dashboard',
            active: pathname === '/dashboard',
        },
        {
            label: 'Stream History',
            icon: History,
            href: '/dashboard/history',
            active: pathname === '/dashboard/history',
            disabled: true,
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
        <div className={cn("pb-12 h-full flex flex-col bg-white border-r", className)}>
            <div className="space-y-4 py-6">
                <div className="px-3 py-2 flex-1">
                    <div className="space-y-1">
                        {routes.map((route) => (
                            <Link
                                key={route.href}
                                href={route.disabled ? '#' : route.href}
                                className={cn(
                                    "text-sm group flex p-3 w-full justify-start font-medium cursor-pointer hover:text-primary hover:bg-primary/5 rounded-lg transition",
                                    route.active ? "text-primary bg-primary/5" : "text-muted-foreground",
                                    route.disabled && "opacity-50 cursor-not-allowed"
                                )}
                            >
                                <div className="flex items-center flex-1">
                                    <route.icon className={cn("h-5 w-5 mr-3", route.active ? "text-primary" : "text-muted-foreground")} />
                                    {route.label}
                                    {route.disabled && <span className="ml-2 text-[10px] bg-muted px-1.5 py-0.5 rounded text-muted-foreground">Soon</span>}
                                </div>
                            </Link>
                        ))}
                    </div>
                </div>
            </div>
            <div className="mt-auto px-6 py-4 border-t">
                <div className="text-xs text-muted-foreground mb-4">RESOURCES</div>
                <div className="space-y-2">
                    <a
                        href="https://docs.droppio.xyz"
                        target="_blank"
                        className="text-sm text-muted-foreground hover:text-primary flex items-center gap-2"
                    >
                        <ExternalLink className="h-4 w-4" />
                        Documentation
                    </a>
                </div>
            </div>
        </div>
    );
}
