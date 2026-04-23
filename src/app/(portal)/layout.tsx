'use client';
export const runtime = 'edge';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';

const authRoutes = new Set(['/login', '/signup', '/forgot-password', '/reset-password', '/verify-email']);
const portalNav = [
  { label: 'Overview', href: '/portal/overview' },
  { label: 'API Keys', href: '/portal/keys' },
  { label: 'Webhooks', href: '/portal/webhooks' },
  { label: 'Usage', href: '/portal/usage' },
  { label: 'Billing', href: '/portal/billing' },
  { label: 'Account', href: '/portal/settings' }
];

type PortalAccount = {
  email: string;
  full_name?: string | null;
  resources?: { api_keys: number; webhooks: number };
  plan?: {
    label: string;
    usage: { analyses_remaining: number };
  };
};

const initials = (account: PortalAccount | null) => {
  const source = account?.full_name?.trim() || account?.email || 'FC';
  const parts = source.split(/\s+/).filter(Boolean);
  if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  return source.slice(0, 2).toUpperCase();
};

export default function PortalLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isAuthRoute = authRoutes.has(pathname);
  const [account, setAccount] = useState<PortalAccount | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    if (isAuthRoute) return;
    let cancelled = false;
    fetch('/api/portal/me', { cache: 'no-store' })
      .then(async (response) => {
        if (!response.ok) return null;
        return (await response.json()) as PortalAccount;
      })
      .then((payload) => {
        if (!cancelled && payload) setAccount(payload);
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, [isAuthRoute]);

  const currentPage = useMemo(() => portalNav.find((item) => item.href === pathname)?.label ?? 'Portal', [pathname]);

  const signOut = async () => {
    await fetch('/api/portal/logout', { method: 'POST' });
    window.location.href = '/';
  };

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
              <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-slate-400 sm:text-sm">
                <span>{currentPage}</span>
                <span className="text-slate-600">/</span>
                <span>Portal workspace</span>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="hidden rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-2 text-right text-xs text-slate-400 md:block">
                <p className="font-medium text-white">{account?.plan?.label || 'Free'} plan</p>
                <p>{account?.plan?.usage.analyses_remaining ?? 0} analyses left</p>
              </div>

              <div className="relative">
                <button onClick={() => setMenuOpen((value) => !value)} className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.04] px-3 py-2 transition hover:bg-white/[0.07]">
                  <span className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-violet-500 to-indigo-600 text-sm font-semibold text-white">{initials(account)}</span>
                  <span className="hidden text-left md:block">
                    <span className="block text-sm font-medium text-white">{account?.full_name || 'My account'}</span>
                    <span className="block text-xs text-slate-400">{account?.email || 'Portal menu'}</span>
                  </span>
                </button>

                {menuOpen ? (
                  <div className="absolute right-0 mt-3 w-72 overflow-hidden rounded-3xl border border-white/10 bg-slate-950/95 shadow-2xl shadow-black/40">
                    <div className="border-b border-white/10 bg-white/[0.03] p-4">
                      <p className="text-sm font-medium text-white">{account?.full_name || 'Portal account'}</p>
                      <p className="mt-1 text-xs text-slate-400">{account?.email}</p>
                      <div className="mt-3 flex flex-wrap gap-2 text-xs">
                        <span className="rounded-full border border-white/10 bg-white/[0.04] px-2.5 py-1 text-slate-300">{account?.plan?.label || 'Free'} plan</span>
                        <span className="rounded-full border border-sky-400/20 bg-sky-400/10 px-2.5 py-1 text-sky-200">{account?.plan?.usage.analyses_remaining ?? 0} left</span>
                      </div>
                    </div>
                    <div className="p-2">
                      {[
                        ['Account', '/portal/settings'],
                        ['Billing', '/portal/billing'],
                        ['API Keys', '/portal/keys'],
                        ['Webhooks', '/portal/webhooks']
                      ].map(([label, href]) => (
                        <Link key={href} href={href} onClick={() => setMenuOpen(false)} className="flex items-center justify-between rounded-2xl px-4 py-3 text-sm text-slate-200 transition hover:bg-white/[0.06]">
                          <span>{label}</span>
                          {label === 'API Keys' ? <span className="text-xs text-slate-500">{account?.resources?.api_keys ?? 0}</span> : null}
                          {label === 'Webhooks' ? <span className="text-xs text-slate-500">{account?.resources?.webhooks ?? 0}</span> : null}
                        </Link>
                      ))}
                    </div>
                    <div className="border-t border-white/10 p-2">
                      <button onClick={signOut} className="w-full rounded-2xl px-4 py-3 text-left text-sm text-rose-200 transition hover:bg-rose-500/10">Sign out</button>
                    </div>
                  </div>
                ) : null}
              </div>
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
