import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowRight, BookOpenCheck, Layers3, ShieldCheck, Sparkles } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { scamPatterns } from '@/lib/scams/patterns';
import type { ScamPatternRecommendedAction, ScamPatternRiskTier } from '@/lib/scams/patterns';

export const runtime = 'edge';

export const metadata: Metadata = {
  title: 'Scam Call Playbooks — FilterCalls',
  description: 'Learn common scam call patterns, what callers may say, what not to share, safe response scripts, and how to verify safely.',
  alternates: { canonical: 'https://filtercalls.com/scams' },
  robots: { index: true, follow: true },
  openGraph: {
    title: 'FilterCalls Scam Call Playbooks',
    description: 'Learn the pattern. Know what to say. Verify safely.',
    url: 'https://filtercalls.com/scams',
    siteName: 'FilterCalls'
  }
};

const RISK_STYLES: Record<ScamPatternRiskTier, string> = {
  critical: 'border-red-300/25 bg-red-400/10 text-red-100',
  high: 'border-orange-300/25 bg-orange-400/10 text-orange-100',
  medium: 'border-amber-300/25 bg-amber-400/10 text-amber-100',
  low: 'border-emerald-300/25 bg-emerald-400/10 text-emerald-100'
};

const ACTION_LABELS: Record<ScamPatternRecommendedAction, string> = {
  block: 'Block',
  send_to_voicemail: 'Send to voicemail',
  verify_first: 'Verify first',
  answer_cautiously: 'Answer cautiously'
};

const ACTION_STYLES: Record<ScamPatternRecommendedAction, string> = {
  block: 'border-red-300/20 bg-red-300/10 text-red-100',
  send_to_voicemail: 'border-orange-300/20 bg-orange-300/10 text-orange-100',
  verify_first: 'border-amber-300/20 bg-amber-300/10 text-amber-100',
  answer_cautiously: 'border-emerald-300/20 bg-emerald-300/10 text-emerald-100'
};

const RISK_ORDER: Record<ScamPatternRiskTier, number> = {
  critical: 0,
  high: 1,
  medium: 2,
  low: 3
};

const sortedPatterns = [...scamPatterns].sort((left, right) => RISK_ORDER[left.riskTier] - RISK_ORDER[right.riskTier] || left.shortTitle.localeCompare(right.shortTitle));

export default function ScamsPage() {
  const criticalCount = scamPatterns.filter((pattern) => pattern.riskTier === 'critical').length;
  const highCount = scamPatterns.filter((pattern) => pattern.riskTier === 'high').length;

  return (
    <section className="space-y-12">
      <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-white/[0.035] p-6 shadow-glow sm:p-8 lg:p-10">
        <div className="pointer-events-none absolute inset-x-0 top-0 h-40 bg-gradient-to-b from-violet-500/20 via-cyan-400/5 to-transparent" />
        <div className="relative grid gap-8 lg:grid-cols-[1.2fr_0.8fr] lg:items-end">
          <div className="max-w-3xl space-y-5">
            <p className="inline-flex items-center gap-2 rounded-full border border-cyan-300/20 bg-cyan-300/10 px-3 py-1 text-xs font-medium uppercase tracking-[0.2em] text-cyan-100">
              <Sparkles className="h-3.5 w-3.5" /> {scamPatterns.length} scam call playbooks
            </p>
            <div className="space-y-4">
              <h1 className="text-4xl font-semibold tracking-tight text-white md:text-6xl">Learn the pattern. Know what to say. Verify safely.</h1>
              <p className="max-w-2xl text-sm leading-7 text-white/58 md:text-base">
                FilterCalls playbooks are practical safety guides for suspicious calls. Each one breaks down the caller script, pressure tactics, what not to share, and the safest verification path.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Link href="/analysis" className="inline-flex items-center gap-2 rounded-2xl bg-primary px-5 py-3 text-sm font-semibold text-white shadow-glow transition hover:opacity-90">
                Analyze a suspicious number <ArrowRight className="h-4 w-4" />
              </Link>
              <Link href="/security" className="inline-flex items-center gap-2 rounded-2xl border border-white/15 bg-white/[0.04] px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/[0.08]">
                How FilterCalls makes decisions
              </Link>
            </div>
          </div>

          <Card className="border border-white/10 bg-black/10">
            <div className="space-y-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-violet-300/20 bg-violet-300/10 text-violet-100">
                <BookOpenCheck className="h-6 w-6" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-white">Call scam intelligence</h2>
                <p className="mt-2 text-sm leading-6 text-white/55">These are not generic articles. Each playbook is structured around the caller’s goal, pressure pattern, safe response, and verification route.</p>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-2xl border border-red-300/15 bg-red-300/[0.06] p-3">
                  <p className="text-2xl font-semibold text-red-100">{criticalCount}</p>
                  <p className="text-xs text-white/45">Critical playbooks</p>
                </div>
                <div className="rounded-2xl border border-orange-300/15 bg-orange-300/[0.06] p-3">
                  <p className="text-2xl font-semibold text-orange-100">{highCount}</p>
                  <p className="text-xs text-white/45">High-risk playbooks</p>
                </div>
              </div>
            </div>
          </Card>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {sortedPatterns.map((pattern) => (
          <Card key={pattern.slug} className="group flex flex-col justify-between gap-5 border border-white/10 bg-white/[0.03] transition hover:-translate-y-0.5 hover:border-cyan-300/25 hover:bg-white/[0.055]">
            <div className="space-y-4">
              <div className="flex flex-wrap gap-2">
                <span className={`rounded-full border px-3 py-1 text-xs font-medium capitalize ${RISK_STYLES[pattern.riskTier]}`}>{pattern.riskTier} risk</span>
                <span className={`rounded-full border px-3 py-1 text-xs font-medium ${ACTION_STYLES[pattern.recommendedAction]}`}>{ACTION_LABELS[pattern.recommendedAction]}</span>
                {pattern.scamLifecycle ? <span className="rounded-full border border-cyan-300/20 bg-cyan-300/10 px-3 py-1 text-xs font-medium text-cyan-100">Lifecycle map</span> : null}
              </div>
              <div>
                <h2 className="text-2xl font-semibold text-white">{pattern.shortTitle}</h2>
                <p className="mt-3 text-sm leading-6 text-white/55">{pattern.summary}</p>
              </div>
              <div className="grid gap-2 text-sm text-white/55">
                <p><span className="font-medium text-white/80">Goal:</span> {pattern.scamGoal ?? pattern.pressureTactics.slice(0, 2).join(' · ')}</p>
                <p><span className="font-medium text-white/80">Never share:</span> {pattern.doNotShare.slice(0, 3).join(', ')}</p>
              </div>
            </div>
            <Link href={`/scams/${pattern.slug}`} className="inline-flex items-center gap-2 text-sm font-semibold text-cyan-100 transition group-hover:translate-x-0.5">
              Open playbook <ArrowRight className="h-4 w-4" />
            </Link>
          </Card>
        ))}
      </div>

      <Card className="border border-violet-300/20 bg-violet-400/[0.05]">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="flex items-center gap-2 text-sm font-medium uppercase tracking-[0.18em] text-violet-100"><Layers3 className="h-4 w-4" /> Use with FilterCalls analysis</p>
            <h2 className="mt-2 text-2xl font-semibold text-white">Got an unknown number right now?</h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-white/55">Analyze the number, then use these playbooks to understand the likely tactic, the safest response, and the right verification path.</p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link href="/analysis" className="inline-flex items-center gap-2 rounded-2xl bg-white px-5 py-3 text-sm font-semibold text-slate-950 transition hover:opacity-90">Analyze a suspicious number</Link>
            <Link href="/privacy" className="inline-flex items-center gap-2 rounded-2xl border border-white/15 bg-white/[0.04] px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/[0.08]"><ShieldCheck className="h-4 w-4" /> Privacy-first approach</Link>
          </div>
        </div>
      </Card>
    </section>
  );
}
