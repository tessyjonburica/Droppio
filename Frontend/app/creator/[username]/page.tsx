'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { Header } from '@/components/layout/header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { streamService } from '@/services/stream.service';
import { creatorService } from '@/services/creator.service';

interface CreatorProfile {
  id: string;
  display_name: string | null;
  avatar_url: string | null;
  bio: string | null;
  wallet_address: string;
  platform: string | null;
}

export default function CreatorProfilePage() {
  const params = useParams();
  const username = params.username as string;
  const [creator, setCreator] = useState<CreatorProfile | null>(null);
  const [activeStream, setActiveStream] = useState<any>(null);

  useEffect(() => {
    const loadCreator = async () => {
      try {
        const profile = await creatorService.getByUsername(username);
        setCreator(profile);
      } catch (error) {
        console.error('Failed to load creator:', error);
        // Creator not found - will show placeholder
      }
    };
    
    if (username) {
      loadCreator();
    }
  }, [username]);

  useEffect(() => {
    if (creator?.id) {
      loadActiveStream();
    }
  }, [creator?.id]);

  const loadActiveStream = async () => {
    if (!creator?.id) return;
    try {
      const stream = await streamService.getActiveStream(creator.id);
      setActiveStream(stream);
    } catch (error) {
      console.error('Failed to load active stream:', error);
    }
  };

  return (
    <>
      <Header />
      <main className="min-h-screen bg-white">
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-4xl mx-auto">
            <Card className="mb-6">
              <CardHeader>
                <div className="flex items-center gap-4">
                  {creator?.avatar_url ? (
                    <img
                      src={creator.avatar_url}
                      alt={creator.display_name || 'Creator'}
                      className="w-24 h-24 rounded-full"
                    />
                  ) : (
                    <div className="w-24 h-24 rounded-full bg-primary/20 flex items-center justify-center">
                      <span className="text-4xl text-primary font-bold">
                        {(creator?.display_name || 'C')[0].toUpperCase()}
                      </span>
                    </div>
                  )}
                  <div>
                    <CardTitle className="text-3xl">
                      {creator?.display_name || 'Creator'}
                    </CardTitle>
                    {creator?.platform && (
                      <CardDescription>Streaming on {creator.platform}</CardDescription>
                    )}
                    {creator?.bio && (
                      <p className="text-sm text-muted-foreground mt-2">{creator.bio}</p>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {activeStream ? (
                  <div className="space-y-4">
                    <div className="flex items-center gap-2">
                      <span className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></span>
                      <span className="font-medium">Currently Live</span>
                    </div>
                    <Link href={`/tip/${username}`}>
                      <Button>Send a Tip</Button>
                    </Link>
                  </div>
                ) : (
                  <p className="text-muted-foreground">Currently offline</p>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </>
  );
}

