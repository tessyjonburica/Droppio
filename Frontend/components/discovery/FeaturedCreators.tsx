'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { creatorService, FeaturedCreator } from '@/services/creator.service';
import { TrendingUp } from 'lucide-react';

export function FeaturedCreators() {
    const [featuredCreators, setFeaturedCreators] = useState<FeaturedCreator[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const loadFeatured = async () => {
            try {
                const creators = await creatorService.getFeaturedCreators(8);
                setFeaturedCreators(creators);
            } catch (error) {
                console.error('Failed to load featured creators:', error);
            } finally {
                setIsLoading(false);
            }
        };
        loadFeatured();
    }, []);

    if (isLoading) {
        return (
            <section id="featured-creators" className="py-20 bg-soft-mint">
                <div className="container mx-auto px-4">
                    <div className="max-w-6xl mx-auto text-center">
                        <p className="text-muted-foreground">Loading featured creators...</p>
                    </div>
                </div>
            </section>
        );
    }

    if (featuredCreators.length === 0) return null;

    return (
        <section id="featured-creators" className="py-20 bg-soft-mint">
            <div className="container mx-auto px-4">
                <div className="max-w-6xl mx-auto">
                    <div className="flex items-center gap-3 mb-8">
                        <TrendingUp className="h-6 w-6 text-primary" />
                        <h2 className="font-header text-4xl text-primary">Featured Creators</h2>
                    </div>
                    <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
                        {featuredCreators.map((creator) => (
                            <Link
                                key={creator.id}
                                href={`/tip/${creator.display_name || creator.wallet_address}`}
                            >
                                <Card className="hover:shadow-lg transition-shadow cursor-pointer h-full">
                                    <CardHeader>
                                        <div className="flex items-center gap-4">
                                            {creator.avatar_url ? (
                                                <img
                                                    src={creator.avatar_url}
                                                    alt={creator.display_name || 'Creator'}
                                                    className="w-16 h-16 rounded-full object-cover"
                                                />
                                            ) : (
                                                <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center">
                                                    <span className="text-2xl text-primary font-bold">
                                                        {(creator.display_name || 'C')[0].toUpperCase()}
                                                    </span>
                                                </div>
                                            )}
                                            <div className="flex-1 min-w-0">
                                                <CardTitle className="text-lg truncate">
                                                    {creator.display_name || creator.wallet_address.slice(0, 8)}
                                                </CardTitle>
                                                {creator.platform && (
                                                    <CardDescription className="capitalize">
                                                        {creator.platform}
                                                    </CardDescription>
                                                )}
                                                <p className="text-xs text-muted-foreground mt-1">
                                                    {creator.total_tips_count} tips received
                                                </p>
                                            </div>
                                        </div>
                                    </CardHeader>
                                </Card>
                            </Link>
                        ))}
                    </div>
                </div>
            </div>
        </section>
    );
}
