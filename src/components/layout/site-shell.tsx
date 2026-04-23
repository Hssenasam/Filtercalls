'use client';

import { ReactNode } from 'react';
import { usePathname } from 'next/navigation';
import { SiteHeader } from '@/components/layout/site-header';
import { SiteFooter } from '@/components/layout/site-footer';

const standaloneRoutes = new Set(['/login', '/signup', '/forgot-password', '/reset-password', '/verify-email']);

export const SiteShell = ({ children }: { children: ReactNode }) => {
  const pathname = usePathname();
  const isPortalRoute = pathname.startsWith('/portal');
  const isStandaloneAuthRoute = standaloneRoutes.has(pathname);

  if (isPortalRoute || isStandaloneAuthRoute) {
    return <>{children}</>;
  }

  return (
    <div className="min-h-screen bg-signal-grid [background-size:22px_22px]">
      <SiteHeader />
      <main className="mx-auto w-full max-w-6xl px-4 py-10">{children}</main>
      <SiteFooter />
    </div>
  );
};
