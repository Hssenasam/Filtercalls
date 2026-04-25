'use client';

import { useState } from 'react';
import { Copy, MessageCircle, Share2 } from 'lucide-react';

export function ShareActions({ url }: { url: string }) {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    await navigator.clipboard.writeText(url);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div className="flex flex-wrap gap-2">
      <button type="button" onClick={copy} className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.05] px-3 py-2 text-sm text-white/80 hover:bg-white/[0.08]"><Copy className="h-4 w-4" /> {copied ? 'Copied!' : 'Copy link'}</button>
      <a href={`https://wa.me/?text=${encodeURIComponent(url)}`} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 rounded-xl border border-emerald-400/20 bg-emerald-400/10 px-3 py-2 text-sm text-emerald-100"><MessageCircle className="h-4 w-4" /> WhatsApp</a>
      <a href={`https://twitter.com/intent/tweet?url=${encodeURIComponent(url)}&text=${encodeURIComponent('Caller reputation report from FilterCalls')}`} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 rounded-xl border border-sky-400/20 bg-sky-400/10 px-3 py-2 text-sm text-sky-100"><Share2 className="h-4 w-4" /> X/Twitter</a>
    </div>
  );
}
