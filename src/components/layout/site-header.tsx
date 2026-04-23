'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, X, Zap } from 'lucide-react';

const NAV_LINKS = [
  { label: 'Features', href: '/#features' },
  { label: 'Pricing', href: '/pricing' },
  { label: 'Solutions', href: '/solutions' },
  { label: 'API Docs', href: '/api-docs' },
];

export function SiteHeader() {
  const [scrolled, setScrolled] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    document.body.style.overflow = drawerOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [drawerOpen]);

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
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 shrink-0">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-violet-500/25">
              <Zap className="w-4 h-4 text-white" strokeWidth={2.5} />
            </div>
            <span className="text-white font-semibold text-[15px] tracking-tight">
              FilterCalls
            </span>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-1">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="px-3.5 py-2 text-sm text-white/60 hover:text-white rounded-lg hover:bg-white/[0.06] transition-all duration-150"
              >
                {link.label}
              </Link>
            ))}
          </nav>

          {/* Desktop CTAs */}
          <div className="hidden md:flex items-center gap-2">
            <Link
              href="/portal/login"
              className="px-4 py-2 text-sm text-white/70 hover:text-white rounded-lg hover:bg-white/[0.06] transition-all duration-150"
            >
              Sign in
            </Link>
            <Link
              href="/analysis"
              className="px-4 py-2 text-sm font-medium text-white rounded-lg bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 shadow-lg shadow-violet-500/20 hover:shadow-violet-500/30 transition-all duration-200 active:scale-[0.97]"
            >
              Analyze now
            </Link>
          </div>

          {/* Mobile Hamburger */}
          <button
            onClick={() => setDrawerOpen(true)}
            className="md:hidden p-2 rounded-lg text-white/70 hover:text-white hover:bg-white/[0.06] transition-all"
            aria-label="Open menu"
          >
            <Menu className="w-5 h-5" />
          </button>
        </div>
      </header>

      {/* Mobile Drawer */}
      <AnimatePresence>
        {drawerOpen && (
          <>
            <motion.div
              key="backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-sm"
              onClick={() => setDrawerOpen(false)}
            />
            <motion.div
              key="drawer"
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 28, stiffness: 280 }}
              className="fixed top-0 right-0 bottom-0 z-[70] w-72 bg-[#0f0f18] border-l border-white/[0.06] flex flex-col"
            >
              <div className="flex items-center justify-between px-5 h-16 border-b border-white/[0.06]">
                <span className="text-white font-semibold text-[15px]">Menu</span>
                <button
                  onClick={() => setDrawerOpen(false)}
                  className="p-2 rounded-lg text-white/60 hover:text-white hover:bg-white/[0.06] transition-all"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <nav className="flex flex-col gap-1 p-4 flex-1">
                {NAV_LINKS.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={() => setDrawerOpen(false)}
                    className="px-4 py-3 text-sm text-white/70 hover:text-white rounded-xl hover:bg-white/[0.06] transition-all"
                  >
                    {link.label}
                  </Link>
                ))}
              </nav>

              <div className="flex flex-col gap-3 p-4 border-t border-white/[0.06]">
                <Link
                  href="/portal/login"
                  onClick={() => setDrawerOpen(false)}
                  className="w-full px-4 py-3 text-sm text-center text-white/70 hover:text-white rounded-xl border border-white/[0.08] hover:bg-white/[0.06] transition-all"
                >
                  Sign in
                </Link>
                <Link
                  href="/analysis"
                  onClick={() => setDrawerOpen(false)}
                  className="w-full px-4 py-3 text-sm font-medium text-center text-white rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 shadow-lg shadow-violet-500/20 transition-all active:scale-[0.97]"
                >
                  Analyze now
                </Link>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
