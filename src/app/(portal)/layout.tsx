'use client';
export const runtime = 'edge';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const authRoutes = new Set(['/login', '/signup', '/forgot-password', '/reset-password', '/verify-email']);
const portalNav = [
  { label: 'Overview', href: '/portal/overview' },
  { label: 'API Keys', href: '/portal/keys' },
  { label: 'Webhooks', href: '/portal/webhooks' },
  { label: 'Usage', href: '/portal/usage' },
  { label: 'Billing', href: '/portal/billing' },
  { label: 'Account', href: '/portal/settings' }
];

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
      <header className="sticky top-0 z-40 border-b border-white/10 bg-slate-950/85 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between gap-4">
            <div>
              <Link href="/" className="inline-flex items-center gap-3 font-semibold text-white">
                <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-500 via-indigo-500 to-sky-500 shadow-lg shadow-indigo-900/40">⚡</span>
                <span className="text-lg">FilterCalls</span>
              </Link>
              <p className="mt-1 text-sm text-slate-400">Developer command center for identity, analysis, usage, and billing.</p>
            </div>
            <div className="hidden rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-2 text-right text-xs text-slate-400 md:block">
              <p className="font-medium text-white">Portal workspace</p>
              <p>Everything after sign-in lives here.</p>
            </div>
          </div>

          <nav className="-mx-1 overflow-x-auto pb-1">
            <div className="flex min-w-max gap-2 px-1">
              {portalNav.map((item) => {
                const active = pathname === item.href;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`rounded-2xl px-4 py-2.5 text-sm font-medium transition ${active ? 'bg-gradient-to-r from-sky-500/25 to-indigo-500/25 text-white shadow-[inset_0_0_0_1px_rgba(125,211,252,0.25)]' : 'text-slate-300 hover:bg-white/[0.06] hover:text-white'}`}
                  >
                    {item.label}
                  </Link>
                );
              })}
            </div>
          </nav>
        </div>
      </header>
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">{children}</main>
    </div>
  );
}
