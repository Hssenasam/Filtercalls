'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { ExternalLink, Tag, X } from 'lucide-react';
import { cn } from '@/lib/utils';

const SEDO_URL = 'https://sedo.com/search/details/?domain=filtercalls.com&origin=domaindetails';
const STORAGE_KEY = 'fc_domain_sale_popup_hidden_until';
const HIDE_DAYS = 7;

const hiddenUntilDate = () => {
  const date = new Date();
  date.setDate(date.getDate() + HIDE_DAYS);
  return date.getTime();
};

export const DomainSaleWidget = () => {
  const [popupOpen, setPopupOpen] = useState(false);
  const [floatingOpen, setFloatingOpen] = useState(false);

  const shouldShowPopup = useMemo(() => {
    if (typeof window === 'undefined') return false;
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return true;
    const expiry = Number(raw);
    return Number.isNaN(expiry) || Date.now() > expiry;
  }, []);

  useEffect(() => {
    if (!shouldShowPopup) return;
    const timer = window.setTimeout(() => setPopupOpen(true), 12000);
    return () => window.clearTimeout(timer);
  }, [shouldShowPopup]);

  const dismissPopup = () => {
    window.localStorage.setItem(STORAGE_KEY, String(hiddenUntilDate()));
    setPopupOpen(false);
  };

  return (
    <>
      <div className="fixed inset-x-0 top-16 z-40 border-y border-amber-300/20 bg-amber-500/10 backdrop-blur-lg">
        <div className="mx-auto flex w-full max-w-7xl items-center justify-between gap-3 px-4 py-2 text-xs sm:text-sm">
          <p className="text-amber-100">
            <span className="font-semibold">FilterCalls.com</span> is for sale — available now on Sedo.
          </p>
          <Link
            href={SEDO_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex shrink-0 items-center gap-1 rounded-lg border border-amber-200/30 bg-amber-300/15 px-2.5 py-1 text-amber-50 transition hover:bg-amber-300/25"
          >
            View Listing <ExternalLink className="h-3.5 w-3.5" />
          </Link>
        </div>
      </div>

      <div className="pointer-events-none fixed bottom-5 left-5 z-50 print:hidden">
        <div
          className={cn(
            'pointer-events-auto mb-3 w-[calc(100vw-2.5rem)] max-w-xs rounded-2xl border border-amber-200/20 bg-slate-950/95 p-4 shadow-2xl shadow-black/50 backdrop-blur-xl transition-all duration-300',
            floatingOpen ? 'translate-y-0 opacity-100' : 'pointer-events-none translate-y-4 opacity-0'
          )}
        >
          <p className="text-sm font-semibold text-white">FilterCalls.com is for sale</p>
          <p className="mt-1 text-xs text-white/65">Premium domain listed now on Sedo marketplace.</p>
          <Link
            href={SEDO_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-amber-200 hover:text-amber-100"
          >
            Buy via Sedo <ExternalLink className="h-3.5 w-3.5" />
          </Link>
        </div>

        <button
          type="button"
          onClick={() => setFloatingOpen((value) => !value)}
          className="pointer-events-auto flex h-12 w-12 items-center justify-center rounded-2xl border border-amber-200/30 bg-gradient-to-br from-amber-500 to-orange-500 text-white shadow-lg shadow-amber-950/50 transition hover:scale-105"
          aria-label={floatingOpen ? 'Close domain sale widget' : 'Open domain sale widget'}
        >
          {floatingOpen ? <X className="h-5 w-5" /> : <Tag className="h-5 w-5" />}
        </button>
      </div>

      {popupOpen ? (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/65 px-4">
          <div className="w-full max-w-md rounded-3xl border border-white/15 bg-[#0b0b12] p-6 shadow-2xl shadow-black/70">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-amber-200/85">Domain opportunity</p>
                <h3 className="mt-2 text-xl font-semibold text-white">FilterCalls.com is available for acquisition</h3>
              </div>
              <button type="button" onClick={dismissPopup} className="rounded-full border border-white/15 p-2 text-white/70 hover:text-white" aria-label="Close domain sale popup">
                <X className="h-4 w-4" />
              </button>
            </div>
            <p className="mt-3 text-sm text-white/70">Secure transaction handled by Sedo. Open listing to review details and submit your offer.</p>
            <div className="mt-5 flex items-center gap-3">
              <Link href={SEDO_URL} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 px-4 py-2 text-sm font-semibold text-black transition hover:brightness-105">
                View Listing on Sedo <ExternalLink className="h-4 w-4" />
              </Link>
              <button type="button" onClick={dismissPopup} className="text-sm text-white/65 hover:text-white">Not now</button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
};
