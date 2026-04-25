'use client';

import Link from 'next/link';
import { useState } from 'react';
import { CheckCircle2, LockKeyhole, Sparkles } from 'lucide-react';
import { Card } from '@/components/ui/card';

type QuickCategory = 'scam' | 'spam' | 'safe';

const quickButtons: Array<{ category: QuickCategory; label: string; severity: 'low' | 'medium' }> = [
  { category: 'scam', label: '🚨 Scam', severity: 'medium' },
  { category: 'spam', label: '📢 Spam', severity: 'medium' },
  { category: 'safe', label: '✅ Safe', severity: 'low' }
];

export const GuestLimitCard = ({ number }: { number?: string }) => {
  const next = number ? `/analysis?number=${encodeURIComponent(number)}` : '/analysis';
  const signupHref = `/signup?next=${encodeURIComponent(next)}`;
  const loginHref = `/login?next=${encodeURIComponent(next)}`;
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState<string | null>(null);
  const [reportHash, setReportHash] = useState<string | null>(null);

  const quickReport = async (category: QuickCategory, severity: 'low' | 'medium') => {
    if (!number) return;
    setLoading(category);
    setMessage(null);
    try {
      const response = await fetch('/api/reports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ number, category, severity, quick: true })
      });
      const payload = await response.json().catch(() => null);
      if (!response.ok) throw new Error(payload?.error?.message ?? 'Unable to submit report.');
      setReportHash(payload?.number_hash_preview ?? null);
      setMessage('Thanks — your report helps improve community intelligence.');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Unable to submit report.');
    } finally {
      setLoading(null);
    }
  };

  return (
    <Card className="relative overflow-hidden border border-violet-400/20 bg-gradient-to-br from-violet-500/10 via-slate-950 to-cyan-500/10">
      <div className="pointer-events-none absolute inset-0 opacity-45 blur-sm">
        <div className="grid gap-3 md:grid-cols-4">
          {['Risk', 'Trust', 'Type', 'Confidence'].map((item) => <div key={item} className="h-24 rounded-2xl border border-white/10 bg-white/[0.06]" />)}
        </div>
        <div className="mt-5 h-28 rounded-3xl border border-white/10 bg-white/[0.05]" />
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          <div className="h-20 rounded-2xl border border-white/10 bg-white/[0.05]" />
          <div className="h-20 rounded-2xl border border-white/10 bg-white/[0.05]" />
        </div>
      </div>

      <div className="relative z-10 flex min-h-[360px] flex-col items-center justify-center px-4 py-10 text-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-violet-300/25 bg-violet-300/10 text-violet-100 shadow-lg shadow-violet-950/30"><LockKeyhole className="h-6 w-6" /></div>
        <p className="mt-5 inline-flex items-center gap-2 rounded-full border border-cyan-300/20 bg-cyan-300/10 px-3 py-1 text-xs font-medium text-cyan-100"><Sparkles className="h-3.5 w-3.5" /> Free guest report used</p>
        <h3 className="mt-4 max-w-xl text-2xl font-semibold text-white">Create a free account to unlock the full report.</h3>
        <p className="mt-3 max-w-lg text-sm leading-6 text-white/55">Guests get one complete caller-intelligence report. Free accounts unlock 20 monthly analyses, saved portal access, API keys, and usage tracking.</p>

        {number ? (
          <div className="mt-6 rounded-2xl border border-white/10 bg-black/20 p-4">
            <p className="text-sm font-medium text-white">Want to help the community?</p>
            <p className="mt-1 text-xs text-white/45">Report this number without running another analysis.</p>
            <div className="mt-3 flex flex-wrap justify-center gap-2">
              {quickButtons.map((button) => (
                <button key={button.category} type="button" onClick={() => void quickReport(button.category, button.severity)} disabled={!!loading} className="rounded-full border border-white/10 bg-white/[0.05] px-3 py-1.5 text-xs text-white/75 hover:bg-white/[0.09] disabled:opacity-50">
                  {loading === button.category ? 'Sending…' : button.label}
                </button>
              ))}
            </div>
            {message ? <p className="mt-3 flex items-center justify-center gap-2 text-xs text-emerald-300"><CheckCircle2 className="h-3.5 w-3.5" /> {message}</p> : null}
            {reportHash ? <Link href={`/report/${reportHash}`} className="mt-3 inline-flex text-xs text-violet-200 underline-offset-4 hover:underline">View public report</Link> : null}
          </div>
        ) : null}

        <div className="mt-6 flex flex-col gap-3 sm:flex-row">
          <Link href={signupHref} className="inline-flex items-center justify-center rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 px-5 py-2.5 text-sm font-medium text-white shadow-lg shadow-violet-950/30">Create free account</Link>
          <Link href={loginHref} className="inline-flex items-center justify-center rounded-xl border border-white/10 bg-white/[0.05] px-5 py-2.5 text-sm font-medium text-white/80 hover:bg-white/[0.08]">Log in</Link>
        </div>
      </div>
    </Card>
  );
};
