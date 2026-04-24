'use client';

import { useState } from 'react';
import { MessageCircle, X } from 'lucide-react';
import { ContactForm } from '@/components/contact/contact-form';
import { cn } from '@/lib/utils';

export const FloatingContactWidget = () => {
  const [open, setOpen] = useState(false);

  return (
    <div className="pointer-events-none fixed bottom-5 right-5 z-50 print:hidden">
      <div
        className={cn(
          'pointer-events-auto mb-4 w-[calc(100vw-2.5rem)] max-w-sm overflow-hidden rounded-3xl border border-white/12 bg-slate-950/95 shadow-2xl shadow-black/40 backdrop-blur-xl transition-all duration-300',
          open ? 'translate-y-0 opacity-100' : 'pointer-events-none translate-y-4 opacity-0'
        )}
      >
        <div className="flex items-start justify-between gap-3 border-b border-white/10 p-4">
          <div>
            <p className="text-sm font-semibold text-white">Contact FilterCalls</p>
            <p className="mt-1 text-xs text-white/45">Questions, API access, support, or partnerships.</p>
          </div>
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="rounded-full border border-white/10 bg-white/[0.04] p-2 text-white/65 transition hover:bg-white/[0.08] hover:text-white"
            aria-label="Close contact form"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="max-h-[70vh] overflow-y-auto p-4">
          <ContactForm compact onSuccess={() => window.setTimeout(() => setOpen(false), 1400)} />
        </div>
      </div>

      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="pointer-events-auto group flex h-14 w-14 items-center justify-center rounded-2xl border border-violet-300/25 bg-gradient-to-br from-violet-600 to-cyan-500 text-white shadow-xl shadow-violet-950/40 transition hover:scale-105 focus:outline-none focus:ring-2 focus:ring-violet-300/50"
        aria-label={open ? 'Close contact form' : 'Open contact form'}
      >
        {open ? <X className="h-6 w-6" /> : <MessageCircle className="h-6 w-6 transition group-hover:rotate-6" />}
      </button>
    </div>
  );
};
