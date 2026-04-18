'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ShieldCheck, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';

const links = [
  ['/', 'Home'],
  ['/analysis', 'Analyze'],
  ['/api-docs', 'API'],
  ['/solutions', 'Solutions'],
  ['/pricing', 'Pricing'],
  ['/about', 'About'],
  ['/contact', 'Contact']
] as const;

export const SiteHeader = () => {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-40 border-b border-white/10 bg-background/80 backdrop-blur-lg">
      <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between px-4">
        <Link href="/" className="group flex items-center gap-2 font-semibold text-foreground">
          <ShieldCheck className="h-5 w-5 text-accent" />
          <span>FilterCalls</span>
          <Sparkles className="h-4 w-4 text-primary transition group-hover:rotate-12" />
        </Link>

        <nav className="hidden items-center gap-1 md:flex">
          {links.map(([href, label]) => (
            <Link
              key={href}
              href={href}
              className={cn(
                'rounded-lg px-3 py-2 text-sm text-muted transition hover:bg-white/10 hover:text-foreground',
                pathname === href && 'bg-white/10 text-foreground'
              )}
            >
              {label}
            </Link>
          ))}
        </nav>

        <Link href="/analysis" className="rounded-lg border border-white/20 bg-white/5 px-3 py-2 text-sm hover:bg-white/10">
          Live Check
        </Link>
      </div>
    </header>
  );
};
