import type { Metadata } from 'next';

export function generateTipPageMetadata(username: string, creator?: {
  display_name: string | null;
  avatar_url: string | null;
}): Metadata {
  const displayName = creator?.display_name || username;
  const title = `Tip ${displayName} on Droppio`;
  const description = `Support ${displayName} with a tip on Droppio - Wallet-based streaming platform`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: 'website',
      images: creator?.avatar_url
        ? [
            {
              url: creator.avatar_url,
              width: 1200,
              height: 630,
              alt: displayName,
            },
          ]
        : [],
    },
    twitter: {
      card: 'summary',
      title,
      description,
      images: creator?.avatar_url ? [creator.avatar_url] : [],
    },
  };
}

