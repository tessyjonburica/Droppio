import type { Metadata } from 'next';

export function generateCreatorMetadata(username: string, creator?: {
  display_name: string | null;
  avatar_url: string | null;
  platform: string | null;
}): Metadata {
  const displayName = creator?.display_name || username;
  const title = `${displayName} on Droppio`;
  const description = creator?.platform
    ? `Watch ${displayName} stream on ${creator.platform} and send tips on Droppio`
    : `View ${displayName}'s profile on Droppio - Wallet-based streaming platform`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: 'profile',
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
      card: 'summary_large_image',
      title,
      description,
      images: creator?.avatar_url ? [creator.avatar_url] : [],
    },
  };
}

