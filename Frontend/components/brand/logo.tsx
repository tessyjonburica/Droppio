import { cn } from '@/lib/utils';

interface LogoProps {
  className?: string;
  short?: boolean;
}

export function Logo({ className, short = false }: LogoProps) {
  return (
    <h1 className={cn('font-logo text-primary', className)}>
      {short ? 'd.' : 'droppio'}
    </h1>
  );
}

