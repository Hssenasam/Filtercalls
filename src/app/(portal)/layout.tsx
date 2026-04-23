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
  { label: 'Billing', href: '/portal/billing' }
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
  const [panelOpen, setPanelOpen] = useState(false);
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

  useEffect(() => {
    document.body.style.overflow = panelOpen || menuOpen ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [panelOpen, menuOpen]);

  const currentPage = useMemo(() => portalNav.find((item) => item.href === pathname)?.label ?? 'Account', [pathname]);

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
      <header className="fixed inset-x-0 top-0 z-40 border-b border-white/10 bg-slate-950/88 backdrop-blur-xl">
        <div className="mx-auto max-w-7xl px-4 py-3 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0">
              <Link href="/" className="inline-flex items-center gap-3 font-semibold text-white">
                <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-500 via-indigo-500 to-sky-500 shadow-lg shadow-indigo-900/40">⚡</span>
                <span className="text-lg">FilterCalls</span>
              </Link>
              <p className="mt-1 truncate text-xs text-slate-400 sm:text-sm">{currentPage} · Portal workspace</p>
            </div>

            <div className="flex items-center gap-2">
              <div className="hidden rounded-2xl border border-white/10 bg-white/[0.04] px-3 py-2 text-right text-xs text-slate-400 md:block">
                <p className="font-medium text-white">{account?.plan?.label || 'Free'} plan</p>
                <p>{account?.plan?.usage.analyses_remaining ?? 0} analyses left</p>
              </div>
              <button onClick={() => setPanelOpen(true)} className="flex h-11 w-11 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.04] text-sm font-semibold text-white transition hover:bg-white/[0.07]">
                {initials(account)}
              </button>
              <button onClick={() => setMenuOpen((value) => !value)} className="flex h-11 w-11 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.04] text-white transition hover:bg-white/[0.07] md:hidden">
                ☰
              </button>
            </div>
          </div>

          <nav className="mt-3 hidden gap-2 overflow-x-auto pb-1 md:flex">
            {portalNav.map((item) => {
              const active = pathname === item.href;
              return (
                <Link key={item.href} href={item.href} className={`rounded-2xl px-4 py-2.5 text-sm font-medium transition ${active ? 'bg-gradient-to-r from-sky-500/25 to-indigo-500/25 text-white shadow-[inset_0_0_0_1px_rgba(125,211,252,0.25)]' : 'text-slate-300 hover:bg-white/[0.06] hover:text-white'}`}>
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </div>
      </header>

      {menuOpen ? (
        <div className="fixed inset-0 z-40 bg-black/50 md:hidden" onClick={() => setMenuOpen(false)}>
          <div className="absolute inset-x-4 top-[72px] rounded-3xl border border-white/10 bg-slate-950/95 p-3 shadow-2xl shadow-black/40" onClick={(event) => event.stopPropagation()}>
            <div className="grid gap-2">
              {portalNav.map((item) => {
                const active = pathname === item.href;
                return (
                  <Link key={item.href} href={item.href} onClick={() => setMenuOpen(false)} className={`rounded-2xl px-4 py-3 text-sm font-medium ${active ? 'bg-gradient-to-r from-sky-500/25 to-indigo-500/25 text-white' : 'text-slate-300 hover:bg-white/[0.06]'}`}>
                    {item.label}
                  </Link>
                );
              })}
              <Link href="/portal/settings" onClick={() => setMenuOpen(false)} className="rounded-2xl px-4 py-3 text-sm font-medium text-slate-300 hover:bg-white/[0.06]">Account</Link>
            </div>
          </div>
        </div>
      ) : null}

      {panelOpen ? (
        <div className="fixed inset-0 z-50 bg-black/55 backdrop-blur-sm" onClick={() => setPanelOpen(false)}>
          <div className="absolute inset-y-0 right-0 w-[84vw] max-w-sm border-l border-white/10 bg-slate-950/96 p-5 shadow-2xl shadow-black/50" onClick={(event) => event.stopPropagation()}>
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="flex h-14 w-14 items-center justify-center rounded-3xl bg-gradient-to-br from-violet-500 to-indigo-600 text-lg font-semibold text-white">{initials(account)}</div>
                <p className="mt-4 text-lg font-semibold text-white">{account?.full_name || 'Portal account'}</p>
                <p className="mt-1 break-all text-sm text-slate-400">{account?.email}</p>
              </div>
              <button onClick={() => setPanelOpen(false)} className="rounded-2xl border border-white/10 bg-white/[0.04] px-3 py-2 text-sm text-slate-300">Close</button>
            </div>

            <div className="mt-6 rounded-3xl border border-white/10 bg-white/[0.03] p-4">
              <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Usage this month</p>
              <p className="mt-3 text-3xl font-semibold text-white">{account?.plan?.usage.analyses_remaining ?? 0}</p>
              <p className="mt-1 text-sm text-slate-400">Analyses remaining on the {account?.plan?.label || 'Free'} plan.</p>
            </div>

            <div className="mt-6 space-y-2">
              <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Quick actions</p>
              <div className="grid gap-2">
                <Link href="/portal/keys" onClick={() => setPanelOpen(false)} className="rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm font-medium text-white">Create API key</Link>
                <Link href="/portal/webhooks" onClick={() => setPanelOpen(false)} className="rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm font-medium text-white">Add webhook</Link>
              </div>
            </div>

            <div className="mt-6 space-y-2 border-t border-white/10 pt-6">
              {[
                ['Account', '/portal/settings'],
                ['Billing', '/portal/billing'],
                ['API Keys', '/portal/keys'],
                ['Webhooks', '/portal/webhooks'],
                ['Usage', '/portal/usage']
              ].map(([label, href]) => (
                <Link key={href} href={href} onClick={() => setPanelOpen(false)} className="flex items-center justify-between rounded-2xl px-4 py-3 text-sm text-slate-200 transition hover:bg-white/[0.06]">
                  <span>{label}</span>
                </Link>
              ))}
            </div>

            <div className="mt-6 border-t border-white/10 pt-6">
              <button onClick={signOut} className="w-full rounded-2xl border border-rose-400/20 bg-rose-500/10 px-4 py-3 text-left text-sm font-medium text-rose-200 transition hover:bg-rose-500/15">Sign out</button>
            </div>
          </div>
        </div>
      ) : null}

      <main className="portal-page-shell mx-auto max-w-7xl px-4 pb-8 sm:px-6 lg:px-8">{children}</main>
    </div>
  );
}
