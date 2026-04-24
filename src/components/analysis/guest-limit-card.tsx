import Link from 'next/link';
import { LockKeyhole, Sparkles } from 'lucide-react';
import { Card } from '@/components/ui/card';

export const GuestLimitCard = ({ number }: { number?: string }) => {
  const next = number ? `/analysis?number=${encodeURIComponent(number)}` : '/analysis';
  const signupHref = `/signup?next=${encodeURIComponent(next)}`;
  const loginHref = `/login?next=${encodeURIComponent(next)}`;

  return (
    <Card className="relative overflow-hidden border border-violet-400/20 bg-gradient-to-br from-violet-500/10 via-slate-950 to-cyan-500/10">
      <div className="pointer-events-none absolute inset-0 opacity-45 blur-sm">
        <div className="grid gap-3 md:grid-cols-4">
          {['Risk', 'Trust', 'Type', 'Confidence'].map((item) => (
            <div key={item} className="h-24 rounded-2xl border border-white/10 bg-white/[0.06]" />
          ))}
        </div>
        <div className="mt-5 h-28 rounded-3xl border border-white/10 bg-white/[0.05]" />
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          <div className="h-20 rounded-2xl border border-white/10 bg-white/[0.05]" />
          <div className="h-20 rounded-2xl border border-white/10 bg-white/[0.05]" />
        </div>
      </div>

      <div className="relative z-10 flex min-h-[320px] flex-col items-center justify-center px-4 py-10 text-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-violet-300/25 bg-violet-300/10 text-violet-100 shadow-lg shadow-violet-950/30">
          <LockKeyhole className="h-6 w-6" />
        </div>
        <p className="mt-5 inline-flex items-center gap-2 rounded-full border border-cyan-300/20 bg-cyan-300/10 px-3 py-1 text-xs font-medium text-cyan-100">
          <Sparkles className="h-3.5 w-3.5" /> Free guest report used
        </p>
        <h3 className="mt-4 max-w-xl text-2xl font-semibold text-white">Create a free account to unlock the full report.</h3>
        <p className="mt-3 max-w-lg text-sm leading-6 text-white/55">
          Guests get one complete caller-intelligence report. Free accounts unlock 20 monthly analyses, saved portal access, API keys, and usage tracking.
        </p>
        <div className="mt-6 flex flex-col gap-3 sm:flex-row">
          <Link href={signupHref} className="inline-flex items-center justify-center rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 px-5 py-2.5 text-sm font-medium text-white shadow-lg shadow-violet-950/30">
            Create free account
          </Link>
          <Link href={loginHref} className="inline-flex items-center justify-center rounded-xl border border-white/10 bg-white/[0.05] px-5 py-2.5 text-sm font-medium text-white/80 hover:bg-white/[0.08]">
            Log in
          </Link>
        </div>
      </div>
    </Card>
  );
};
