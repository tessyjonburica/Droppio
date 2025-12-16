import type { Metadata } from 'next';
import { generateTipPageMetadata } from './metadata';
import { creatorService } from '@/services/creator.service';

type Props = {
  params: { username: string };
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { username } = params;
  let creator = null;

  try {
    creator = await creatorService.getByUsername(username);
  } catch {
    // Creator not found, use default metadata
  }

  return generateTipPageMetadata(username, creator || undefined);
}

export default function TipLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}

