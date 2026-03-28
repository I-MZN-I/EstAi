import Link from 'next/link';
import { cn } from '@/lib/utils';

type LogoProps = {
  className?: string;
  asLink?: boolean;
};

export function Logo({ className, asLink = true }: LogoProps) {
  const content = (
    <span className={cn('font-headline font-bold text-primary', className)}>
      EstAi
    </span>
  );

  if (asLink) {
    return <Link href="/discover">{content}</Link>;
  }

  return content;
}
