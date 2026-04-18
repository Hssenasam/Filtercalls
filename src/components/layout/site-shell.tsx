import { ReactNode } from 'react';
import { SiteHeader } from '@/components/layout/site-header';
import { SiteFooter } from '@/components/layout/site-footer';

export const SiteShell = ({ children }: { children: ReactNode }) => (
  <div className="min-h-screen bg-signal-grid [background-size:22px_22px]">
    <SiteHeader />
    <main className="mx-auto w-full max-w-6xl px-4 py-10">{children}</main>
    <SiteFooter />
  </div>
);
