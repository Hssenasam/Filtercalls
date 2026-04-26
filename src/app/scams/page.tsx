import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowRight, ShieldCheck, Siren, Sparkles } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { getScamPattern } from '@/lib/scams/patterns';
import type { ScamPatternRecommendedAction, ScamPatternRiskTier } from '@/lib/scams/patterns';
import { getHighestRiskPatterns, getPressureTactics, getRadarPatterns } from '@/lib/scams/radar';
import { getScamsCollectionSchema } from '@/lib/scams/schema';

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

export default function ScamsPage() {
  const radarPatterns = getRadarPatterns();
  const highestRisk = getHighestRiskPatterns(4);
  const pressureTactics = getPressureTactics();
  const collectionSchema = getScamsCollectionSchema();

  return (
    <section className="space-y-10">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: collectionSchema }} />

      <Card className="what-to-do-now border border-cyan-300/20 bg-cyan-400/[0.06]">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <p className="inline-flex items-center gap-2 text-xs font-medium uppercase tracking-[0.18em] text-cyan-100"><Siren className="h-4 w-4" /> What should I do now?</p>
            <h1 className="mt-2 text-3xl font-semibold tracking-tight text-white md:text-5xl">If the call feels suspicious, follow this protection flow first.</h1>
          </div>
          <Link href="/analysis" className="inline-flex items-center gap-2 rounded-2xl bg-white px-5 py-3 text-sm font-semibold text-slate-950 transition hover:opacity-90">
            Don&apos;t block. Know first. <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        <ol className="protection-guidance mt-5 grid gap-3 md:grid-cols-2">
          {[
            'Do not share codes, passwords, payment details, or identity numbers.',
            'Ask for a reference number, then end the call.',
            'Verify through an official app, website, or saved contact.',
            'Analyze the number with FilterCalls before calling back.'
          ].map((step, index) => (
            <li key={step} className="flex gap-3 rounded-2xl border border-white/10 bg-black/10 p-4 text-sm leading-6 text-white/70">
              <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-cyan-200 text-xs font-semibold text-slate-950">{index + 1}</span>
              <span>{step}</span>
            </li>
          ))}
        </ol>
      </Card>

      <Card className="border border-white/10 bg-white/[0.03]">
        <p className="inline-flex items-center gap-2 text-xs font-medium uppercase tracking-[0.18em] text-violet-100"><Sparkles className="h-4 w-4" /> Scam Intelligence Radar</p>
        <h2 className="mt-2 text-2xl font-semibold text-white">Currently monitored scam patterns</h2>
        <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {radarPatterns.map((pattern) => (
            <article key={pattern.slug} className="rounded-2xl border border-white/10 bg-black/10 p-4">
              <div className="flex flex-wrap gap-2">
                <span className={`rounded-full border px-3 py-1 text-xs font-medium capitalize ${RISK_STYLES[pattern.riskTier]}`}>{pattern.riskTier} risk</span>
                <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-medium text-white/75">{ACTION_LABELS[pattern.recommendedAction]}</span>
              </div>
              <h3 className="mt-3 text-lg font-semibold text-white">{pattern.name}</h3>
              <p className="mt-2 text-sm leading-6 text-white/60">Primary tactic: {pattern.primaryTactic}</p>
              <Link href={`/scams/${pattern.slug}`} className="mt-3 inline-flex items-center gap-2 text-sm font-semibold text-cyan-100">
                Open playbook <ArrowRight className="h-4 w-4" />
              </Link>
            </article>
          ))}
        </div>
      </Card>

      <Card className="border border-white/10 bg-white/[0.03]">
        <h2 className="text-2xl font-semibold text-white">Pressure Tactics Map</h2>
        <p className="mt-2 text-sm text-white/60">If you heard these phrases, the caller is likely applying pressure. Verify before sharing anything.</p>
        <div className="mt-5 space-y-3">
          {pressureTactics.map((tactic) => (
            <details key={tactic.id} className="group rounded-2xl border border-white/10 bg-black/10 p-4">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-white">{tactic.label}</p>
                  <p className="mt-1 text-sm text-amber-100">⚠️ “{tactic.warningPhrase}”</p>
                </div>
                <span className="text-xs text-white/45 group-open:hidden">Show playbooks</span>
                <span className="hidden text-xs text-white/45 group-open:inline">Hide playbooks</span>
              </summary>
              <div className="mt-3 flex flex-wrap gap-2">
                {tactic.matchedPlaybooks.map((slug) => {
                  const pattern = getScamPattern(slug);
                  if (!pattern) return null;
                  return (
                    <Link key={slug} href={`/scams/${slug}`} className="rounded-full border border-cyan-300/20 bg-cyan-300/10 px-3 py-1 text-xs font-medium text-cyan-100">
                      {pattern.shortTitle}
                    </Link>
                  );
                })}
              </div>
            </details>
          ))}
        </div>
      </Card>

      <Card className="border border-white/10 bg-white/[0.03]">
        <h2 className="text-2xl font-semibold text-white">Highest-risk patterns</h2>
        <div className="mt-5 grid gap-4 lg:grid-cols-2">
          {highestRisk.map((pattern) => (
            <article key={pattern.slug} className="rounded-2xl border border-white/10 bg-black/10 p-4">
              <div className="flex flex-wrap gap-2">
                <span className={`rounded-full border px-3 py-1 text-xs font-medium capitalize ${RISK_STYLES[pattern.riskTier]}`}>{pattern.riskTier} risk</span>
                <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-medium text-white/75">{ACTION_LABELS[pattern.recommendedAction]}</span>
              </div>
              <h3 className="mt-3 text-lg font-semibold text-white">{pattern.name}</h3>
              <p className="mt-2 text-sm text-white/60">Never share: {pattern.doNotShare.join(', ')}</p>
              <Link href={`/scams/${pattern.slug}`} className="mt-3 inline-flex items-center gap-2 text-sm font-semibold text-cyan-100">
                Open playbook <ArrowRight className="h-4 w-4" />
              </Link>
            </article>
          ))}
        </div>
      </Card>

      <Card className="border border-violet-300/20 bg-violet-400/[0.05]">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-sm text-white/65">Internal links</p>
            <div className="mt-2 flex flex-wrap gap-3">
              <Link href="/analysis" className="text-sm font-semibold text-cyan-100">/analysis</Link>
              <Link href="/security" className="text-sm font-semibold text-cyan-100">/security</Link>
              <Link href="/api-docs" className="text-sm font-semibold text-cyan-100">/api-docs</Link>
            </div>
          </div>
          <Link href="/analysis" className="inline-flex items-center gap-2 rounded-2xl border border-white/15 bg-white/[0.04] px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/[0.08]">
            Analyze now <ShieldCheck className="h-4 w-4" />
          </Link>
        </div>
      </Card>
    </section>
  );
}
