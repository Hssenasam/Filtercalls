'use client';
export const runtime = 'edge';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const authRoutes = new Set(['/login', '/signup', '/forgot-password', '/reset-password', '/verify-email']);

export default function PortalLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isAuthRoute = authRoutes.has(pathname);

  if (isAuthRoute) {
    return (
      <div className="min-h-screen bg-slate-950 px-4 py-6 text-white sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">{children}</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <header className="border-b border-white/10 bg-slate-950/80 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
          <Link href="/" className="font-semibold">FilterCalls</Link>
          <nav className="flex gap-4 text-sm text-slate-300">
            <Link href="/portal/overview">Overview</Link>
            <Link href="/portal/keys">API Keys</Link>
            <Link href="/portal/webhooks">Webhooks</Link>
            <Link href="/portal/usage">Usage</Link>
            <Link href="/portal/billing">Billing</Link>
            <Link href="/portal/settings">Settings</Link>
          </nav>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-8">{children}</main>
    </div>
  );
}
