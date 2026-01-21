'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Input } from '@/components/ui/input';
import { Search } from 'lucide-react';
import { creatorService, CreatorProfile } from '@/services/creator.service';

interface SearchBarProps {
    variant?: 'default' | 'hero';
}

export function SearchBar({ variant = 'default' }: SearchBarProps) {
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
        <div className={`relative w-full text-[#303642] ${variant === 'default' ? 'max-w-2xl mx-auto mb-8' : ''}`} ref={searchRef}>
            <div className="relative">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-[#303642]/40 h-5 w-5" />
                <Input
                    type="text"
                    placeholder="Search creators, streams, or platforms"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onFocus={() => {
                        if (searchResults.length > 0) setShowResults(true);
                    }}
                    className={`pl-12 border-none bg-transparent focus-visible:ring-0 text-[#303642] placeholder:text-[#303642]/40 ${variant === 'hero' ? 'h-14 text-lg' : 'h-12'}`}
                />
            </div>

            {showResults && (
                <div className="absolute top-full left-0 right-0 mt-4 bg-white border border-gray-100 rounded-[24px] shadow-2xl z-50 max-h-96 overflow-y-auto animate-in fade-in slide-in-from-top-2 duration-200">
                    {isSearching ? (
                        <div className="p-6 text-center text-[#303642]/60">Searching creators...</div>
                    ) : searchResults.length > 0 ? (
                        <div className="py-2">
                            {searchResults.map((creator) => (
                                <button
                                    key={creator.id}
                                    onClick={() => handleCreatorClick(creator.display_name || creator.wallet_address)}
                                    className="w-full px-6 py-4 hover:bg-[#F8FAFB] text-left flex items-center gap-4 transition-colors group"
                                >
                                    {creator.avatar_url ? (
                                        <img
                                            src={creator.avatar_url}
                                            alt={creator.display_name || 'Creator'}
                                            className="w-12 h-12 rounded-full object-cover shadow-sm group-hover:scale-105 transition-transform"
                                        />
                                    ) : (
                                        <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                                            <span className="text-primary font-bold text-lg">
                                                {(creator.display_name || 'C')[0].toUpperCase()}
                                            </span>
                                        </div>
                                    )}
                                    <div className="flex-1 min-w-0">
                                        <p className="font-bold text-[#303642] truncate">
                                            {creator.display_name || `${creator.wallet_address.slice(0, 6)}...${creator.wallet_address.slice(-4)}`}
                                        </p>
                                        {creator.platform && (
                                            <p className="text-sm text-[#303642]/50 capitalize font-medium">{creator.platform}</p>
                                        )}
                                    </div>
                                    <div className="text-primary opacity-0 group-hover:opacity-100 transition-opacity">
                                        <Search size={18} />
                                    </div>
                                </button>
                            ))}
                        </div>
                    ) : (
                        <div className="p-6 text-center text-[#303642]/60">No creators found for "{searchQuery}"</div>
                    )}
                </div>
            )}
        </div>
    );
}
