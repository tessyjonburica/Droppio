'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Input } from '@/components/ui/input';
import { Search } from 'lucide-react';
import { creatorService, CreatorProfile } from '@/services/creator.service';

export function SearchBar() {
    const router = useRouter();
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState<CreatorProfile[]>([]);
    const [isSearching, setIsSearching] = useState(false);
    const [showResults, setShowResults] = useState(false);
    const searchRef = useRef<HTMLDivElement | null>(null);

    const performSearch = useCallback(async (query: string) => {
        if (!query.trim()) {
            setSearchResults([]);
            setShowResults(false);
            return;
        }

        setIsSearching(true);
        try {
            const results = await creatorService.searchCreators(query);
            setSearchResults(results);
            setShowResults(true);
        } catch (error) {
            console.error('Search failed:', error);
            setSearchResults([]);
        } finally {
            setIsSearching(false);
        }
    }, []);

    useEffect(() => {
        const timer = setTimeout(() => {
            performSearch(searchQuery);
        }, 300);
        return () => clearTimeout(timer);
    }, [searchQuery, performSearch]);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
                setShowResults(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleCreatorClick = (username: string) => {
        router.push(`/tip/${username}`);
        setShowResults(false);
        setSearchQuery('');
    };

    return (
        <div className="relative max-w-2xl mx-auto mb-8" ref={searchRef}>
            <div className="relative">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-muted-foreground h-5 w-5" />
                <Input
                    type="text"
                    placeholder="Search creators by username, wallet, or platform..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onFocus={() => {
                        if (searchResults.length > 0) setShowResults(true);
                    }}
                    className="pl-12 h-14 text-lg"
                />
            </div>

            {showResults && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-white border rounded-lg shadow-lg z-50 max-h-96 overflow-y-auto">
                    {isSearching ? (
                        <div className="p-4 text-center text-muted-foreground">Searching...</div>
                    ) : searchResults.length > 0 ? (
                        <div className="py-2">
                            {searchResults.map((creator) => (
                                <button
                                    key={creator.id}
                                    onClick={() => handleCreatorClick(creator.display_name || creator.wallet_address)}
                                    className="w-full px-4 py-3 hover:bg-soft-mint text-left flex items-center gap-3 transition-colors"
                                >
                                    {creator.avatar_url ? (
                                        <img
                                            src={creator.avatar_url}
                                            alt={creator.display_name || 'Creator'}
                                            className="w-10 h-10 rounded-full"
                                        />
                                    ) : (
                                        <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                                            <span className="text-primary font-bold">
                                                {(creator.display_name || 'C')[0].toUpperCase()}
                                            </span>
                                        </div>
                                    )}
                                    <div className="flex-1 min-w-0">
                                        <p className="font-medium truncate">
                                            {creator.display_name || `${creator.wallet_address.slice(0, 6)}...${creator.wallet_address.slice(-4)}`}
                                        </p>
                                        {creator.platform && (
                                            <p className="text-sm text-muted-foreground capitalize">{creator.platform}</p>
                                        )}
                                    </div>
                                </button>
                            ))}
                        </div>
                    ) : (
                        <div className="p-4 text-center text-muted-foreground">No creators found</div>
                    )}
                </div>
            )}
        </div>
    );
}
