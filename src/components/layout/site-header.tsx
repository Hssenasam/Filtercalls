'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import type { Route } from 'next';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, X, Zap, LogOut } from 'lucide-react';

type PortalMe = {
  id: string;
  email: string;
  full_name?: string | null;
  plan?: { usage?: { analyses_remaining?: number } };
};

const NAV_LINKS: { label: string; href: string }[] = [
  { label: 'Features', href: '/#features' },
  { label: 'Pricing', href: '/pricing' },
  { label: 'Solutions', href: '/solutions' },
  { label: 'API Docs', href: '/api-docs' },
];

const COMPANY_LINKS: { label: string; href: string }[] = [
  { label: 'About', href: '/about' },
  { label: 'Contact', href: '/contact' },
];

const initialsFromUser = (user: PortalMe | null) => {
  const source = user?.full_name?.trim() || user?.email || 'FC';
  const parts = source.split(/\s+/).filter(Boolean);
  if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  return source.slice(0, 2).toUpperCase();
};

export function SiteHeader() {
  const [scrolled, setScrolled] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [user, setUser] = useState<PortalMe | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [loggingOut, setLoggingOut] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    document.body.style.overflow = drawerOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [drawerOpen]);

  useEffect(() => {
    let cancelled = false;
    fetch('/api/portal/me', { cache: 'no-store' })
      .then(async (response) => {
        if (!response.ok) {
          if (!cancelled) {
            setUser(null);
            setAuthLoading(false);
          }
          return;
        }
        const payload = (await response.json()) as PortalMe;
        if (!cancelled) {
          setUser(payload);
          setAuthLoading(false);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setUser(null);
          setAuthLoading(false);
        }
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const handleLogout = async () => {
    setLoggingOut(true);
    try {
      await fetch('/api/portal/logout', { method: 'POST' });
    } finally {
      window.location.href = '/';
    }
  };

  const remaining = user?.plan?.usage?.analyses_remaining;

  return (
    <>
      <header
        className={`fixed top-0 inset-x-0 z-50 transition-all duration-300 ${
          scrolled
            ? 'bg-[#0a0a0f]/90 backdrop-blur-xl border-b border-white/[0.06] shadow-[0_1px_24px_0_rgba(0,0,0,0.5)]'
            : 'bg-transparent'
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-6">
          <Link href="/" className="flex items-center gap-2 shrink-0">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-violet-500/25">
              <Zap className="w-4 h-4 text-white" strokeWidth={2.5} />
            </div>
            <span className="text-white font-semibold text-[15px] tracking-tight">FilterCalls</span>
          </Link>

          <nav className="hidden md:flex items-center gap-1">
            {[...NAV_LINKS, ...COMPANY_LINKS].map((link) => (
              <a key={link.href} href={link.href} className="px-3.5 py-2 text-sm text-white/60 hover:text-white rounded-lg hover:bg-white/[0.06] transition-all duration-150">
                {link.label}
              </a>
            ))}
          </nav>

          <div className="hidden md:flex items-center gap-2">
            {authLoading ? (
              <div className="h-10 w-40 rounded-xl bg-white/5 animate-pulse" />
            ) : user ? (
              <>
                <div className="hidden lg:flex items-center gap-3 rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2 text-xs text-white/70">
                  <span className="rounded-full bg-emerald-400/10 px-2 py-1 text-emerald-300">Logged in</span>
                  <span>{remaining ?? 0} analyses left</span>
                </div>
                <Link href={'/portal/overview' as Route} className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2 hover:bg-white/[0.07] transition">
                  <span className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-violet-500 to-indigo-600 text-sm font-semibold text-white">{initialsFromUser(user)}</span>
                  <span className="hidden xl:block text-left">
                    <span className="block text-sm font-medium text-white">{user.full_name || 'My account'}</span>
                    <span className="block text-xs text-white/45">Open portal</span>
                  </span>
                </Link>
                <button onClick={handleLogout} disabled={loggingOut} className="px-3 py-2 text-sm text-white/70 hover:text-white rounded-lg hover:bg-white/[0.06] transition-all duration-150">
                  {loggingOut ? 'Signing out...' : 'Sign out'}
                </button>
              </>
            ) : (
              <>
                <Link href={'/login' as Route} className="px-4 py-2 text-sm text-white/70 hover:text-white rounded-lg hover:bg-white/[0.06] transition-all duration-150">Sign in</Link>
                <Link href={'/login' as Route} className="px-4 py-2 text-sm font-medium text-white rounded-lg bg-gradient-to-r from-violet-600 to-indigo-600">Analyze now</Link>
              </>
            )}
          </div>

          <button onClick={() => setDrawerOpen(true)} className="md:hidden p-2 rounded-lg text-white/70 hover:text-white hover:bg-white/[0.06]">
            <Menu className="w-5 h-5" />
          </button>
        </div>
      </header>

      <AnimatePresence>
        {drawerOpen && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[60] bg-black/60" onClick={() => setDrawerOpen(false)} />
            <motion.div initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }} className="fixed top-0 right-0 bottom-0 z-[70] w-72 bg-[#0f0f18] flex flex-col">
              <div className="flex items-center justify-between px-5 h-16">
                <span className="text-white font-semibold">Menu</span>
                <button onClick={() => setDrawerOpen(false)}><X className="w-5 h-5" /></button>
              </div>

              <nav className="flex flex-col gap-1 p-4 flex-1">
                {NAV_LINKS.map((link) => (
                  <a key={link.href} href={link.href} onClick={() => setDrawerOpen(false)} className="px-4 py-3 text-sm text-white/70">{link.label}</a>
                ))}
                <div className="my-2 border-t border-white/10" />
                <p className="px-4 py-1 text-[11px] font-medium uppercase tracking-[0.2em] text-white/35">Company</p>
                {COMPANY_LINKS.map((link) => (
                  <a key={link.href} href={link.href} onClick={() => setDrawerOpen(false)} className="px-4 py-3 text-sm text-white/70">{link.label}</a>
                ))}
                <a href="mailto:contact@filtercalls.com" className="px-4 py-3 text-xs text-violet-200/80">contact@filtercalls.com</a>
              </nav>

              <div className="flex flex-col gap-3 p-4 border-t border-white/10">
                {user ? (
                  <>
                    <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4 text-sm text-white/75">
                      <p className="font-medium text-white">{user.full_name || user.email}</p>
                      <p className="mt-1 text-xs text-white/50">{remaining ?? 0} analyses left this month</p>
                    </div>
                    <Link href={'/portal/overview' as Route} onClick={() => setDrawerOpen(false)} className="text-center text-white">Open portal</Link>
                    <button onClick={handleLogout} className="flex items-center justify-center gap-2 text-center text-white/70">
                      <LogOut className="h-4 w-4" />
                      Sign out
                    </button>
                  </>
                ) : (
                  <>
                    <Link href={'/login' as Route} onClick={() => setDrawerOpen(false)} className="text-center text-white/70">Sign in</Link>
                    <Link href={'/login' as Route} onClick={() => setDrawerOpen(false)} className="text-center text-white">Analyze now</Link>
                  </>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
