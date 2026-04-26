'use client';

import { useState } from 'react';
import Link from 'next/link';
import { AlertTriangle, CheckCircle2, Clipboard, Copy, Eye, ListChecks, Route, ShieldAlert, ShieldCheck } from 'lucide-react';
import { buildAICallDecision } from '@/lib/decision';
import type { AICallDecision, AICallDecisionInput, CallDecisionRiskTier } from '@/lib/decision';
import type { CallIntentAnalysis } from '@/lib/engine/types';
import { getScamPattern } from '@/lib/scams/patterns';
import { matchPlaybooks } from '@/lib/scams/match-playbooks';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

const TIER_STYLES: Record<CallDecisionRiskTier, {
  shell: string;
  panel: string;
  border: string;
  glow: string;
  badge: string;
  icon: string;
  score: string;
  progress: string;
}> = {
  critical: {
    shell: 'border-red-400/30 bg-red-500/[0.08]',
    panel: 'border-red-300/15 bg-red-400/[0.08]',
    border: 'border-red-300/20',
    glow: 'from-red-500/20 via-red-400/5 to-transparent',
    badge: 'border-red-300/25 bg-red-400/15 text-red-100',
    icon: 'border-red-300/25 bg-red-400/15 text-red-100',
    score: 'text-red-100',
    progress: 'bg-red-300'
  },
  high: {
    shell: 'border-orange-400/30 bg-orange-500/[0.08]',
    panel: 'border-orange-300/15 bg-orange-400/[0.08]',
    border: 'border-orange-300/20',
    glow: 'from-orange-500/20 via-orange-400/5 to-transparent',
    badge: 'border-orange-300/25 bg-orange-400/15 text-orange-100',
    icon: 'border-orange-300/25 bg-orange-400/15 text-orange-100',
    score: 'text-orange-100',
    progress: 'bg-orange-300'
  },
  medium: {
    shell: 'border-amber-400/30 bg-amber-500/[0.08]',
    panel: 'border-amber-300/15 bg-amber-400/[0.08]',
    border: 'border-amber-300/20',
    glow: 'from-amber-500/20 via-amber-400/5 to-transparent',
    badge: 'border-amber-300/25 bg-amber-400/15 text-amber-100',
    icon: 'border-amber-300/25 bg-amber-400/15 text-amber-100',
    score: 'text-amber-100',
    progress: 'bg-amber-300'
  },
  low: {
    shell: 'border-emerald-400/30 bg-emerald-500/[0.08]',
    panel: 'border-emerald-300/15 bg-emerald-400/[0.08]',
    border: 'border-emerald-300/20',
    glow: 'from-emerald-500/20 via-cyan-400/5 to-transparent',
    badge: 'border-emerald-300/25 bg-emerald-400/15 text-emerald-100',
    icon: 'border-emerald-300/25 bg-emerald-400/15 text-emerald-100',
    score: 'text-emerald-100',
    progress: 'bg-emerald-300'
  }
};

const ACTION_LABELS: Record<AICallDecision['primaryAction'], string> = {
  block: 'Do not answer',
  send_to_voicemail: 'Send to voicemail',
  verify_first: 'Verify first',
  answer_cautiously: 'Answer cautiously'
};

const ACTION_ICONS: Record<AICallDecision['primaryAction'], typeof ShieldAlert> = {
  block: ShieldAlert,
  send_to_voicemail: AlertTriangle,
  verify_first: Route,
  answer_cautiously: ShieldCheck
};

const SCENARIO_LABELS: Record<AICallDecision['scenario'], string> = {
  possible_impersonation: 'Possible impersonation attempt',
  possible_financial_scam: 'Possible financial pressure call',
  possible_delivery_or_service: 'Possible delivery or service call',
  possible_debt_collection: 'Possible debt collection call',
  possible_sales_or_telemarketing: 'Possible sales or telemarketing call',
  possible_robocall: 'Possible robocall',
  unknown_caller: 'Unknown caller identity',
  likely_safe: 'Likely safe caller'
};

const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value));
const sentenceCase = (value: string) => value.replace(/_/g, ' ').replace(/^\w/, (char) => char.toUpperCase());

const buildDecisionInput = (result: CallIntentAnalysis): AICallDecisionInput => ({
  riskScore: result.risk_score,
  trustScore: result.trust_score,
  nuisanceLevel: result.nuisance_level,
  lineType: result.line_type ?? null,
  countryCode: result.country ?? null,
  probableIntent: result.probable_intent ?? null,
  signals: result.signals.map((signal) => ({
    label: signal.label,
    impact: signal.impact,
    description: signal.detail
  }))
});

const callSafetyScore = (result: CallIntentAnalysis, tier: CallDecisionRiskTier) => {
  const base = Math.round(clamp((100 - result.risk_score) * 0.55 + result.trust_score * 0.45, 0, 100));
  if (tier === 'critical') return clamp(base, 0, 25);
  if (tier === 'high') return clamp(base, 10, 45);
  if (tier === 'medium') return clamp(base, 35, 70);
  return clamp(base, 65, 100);
};

const verificationPath = (decision: AICallDecision) => {
  if (decision.riskTier === 'critical') {
    return [
      'Do not answer or end the call immediately.',
      'Do not call back this number directly.',
      'Contact the organization through its official app, website, or published number.',
      'Report the number if it asked for codes, payment, remote access, or identity details.'
    ];
  }

  if (decision.riskTier === 'high') {
    return [
      'Let the call go to voicemail.',
      'Review whether the caller clearly states their name, company, and reason.',
      'Verify independently before returning the call.',
      'Do not share sensitive information during the callback unless you initiated it through official channels.'
    ];
  }

  if (decision.riskTier === 'medium') {
    return [
      "Ask for the caller's full name, organization, and reference number.",
      'Do not share OTP codes, payment details, passwords, or personal identification.',
      'Pause the conversation and verify through an official channel before continuing.'
    ];
  }

  return [
    'Ask who is calling and what this is regarding.',
    'Continue normally if the caller identity and purpose are clear.',
    'Avoid sharing sensitive information unless you initiated the contact.'
  ];
};

const detailTitle = (tier: CallDecisionRiskTier) => {
  if (tier === 'critical') return 'Safety lock: verify outside the call';
  if (tier === 'high') return 'Safety buffer: let voicemail filter it';
  if (tier === 'medium') return 'Verification needed before sharing anything';
  return 'Low-risk call, but keep basic safeguards';
};

export const AICallDecisionCard = ({ result }: { result: CallIntentAnalysis }) => {
  const [copyState, setCopyState] = useState<'idle' | 'copied' | 'failed'>('idle');
  const decision = buildAICallDecision(buildDecisionInput(result));
  const styles = TIER_STYLES[decision.riskTier];
  const ActionIcon = ACTION_ICONS[decision.primaryAction];
  const score = callSafetyScore(result, decision.riskTier);
  const oneLineReason = decision.reasons.slice(0, 3).join(' · ');
  const path = verificationPath(decision);
  const playbookMatches = matchPlaybooks(decision).reduce<Array<ReturnType<typeof matchPlaybooks>[number] & {
    pattern: NonNullable<ReturnType<typeof getScamPattern>>;
  }>>((acc, match) => {
    const pattern = getScamPattern(match.slug);
    if (!pattern) return acc;
    acc.push({ ...match, pattern });
    return acc;
  }, []);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(decision.recommendedResponse);
      setCopyState('copied');
      window.setTimeout(() => setCopyState('idle'), 2000);
    } catch {
      setCopyState('failed');
      window.setTimeout(() => setCopyState('idle'), 2500);
    }
  };

  return (
    <section className={cn('relative overflow-hidden rounded-3xl border p-5 sm:p-6', styles.shell)}>
      <div className={cn('pointer-events-none absolute inset-x-0 top-0 h-32 bg-gradient-to-b', styles.glow)} />

      <div className="relative space-y-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <Badge className="border-white/15 bg-white/10 text-white">AI Call Decision</Badge>
              <Badge className="border-cyan-300/20 bg-cyan-300/10 text-cyan-100">Decision-support guidance</Badge>
            </div>
            <div>
              <p className="text-sm font-medium text-white/55">Should I answer?</p>
              <div className="mt-2 flex items-center gap-3">
                <span className={cn('inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border', styles.icon)}>
                  <ActionIcon className="h-6 w-6" />
                </span>
                <div>
                  <h4 className="text-2xl font-semibold tracking-tight text-white sm:text-3xl">{ACTION_LABELS[decision.primaryAction]}</h4>
                  <p className="mt-1 text-sm text-white/55">{SCENARIO_LABELS[decision.scenario]}</p>
                </div>
              </div>
            </div>
          </div>

          <div className={cn('rounded-2xl border p-4 sm:min-w-56', styles.panel)}>
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-white/45">Call Safety Score</p>
                <p className={cn('mt-1 text-4xl font-semibold leading-none', styles.score)}>{score}<span className="text-lg text-white/40">/100</span></p>
              </div>
              <div className="text-right">
                <Badge className={styles.badge}>{sentenceCase(decision.riskTier)} risk</Badge>
                <p className="mt-2 text-sm text-white/55">{decision.confidence}% confidence</p>
              </div>
            </div>
            <div className="mt-4 h-2 overflow-hidden rounded-full bg-white/10">
              <div className={cn('h-full rounded-full transition-all duration-700', styles.progress)} style={{ width: `${score}%` }} />
            </div>
          </div>
        </div>

        <div className={cn('rounded-2xl border p-4', styles.border)}>
          <p className="text-xs uppercase tracking-[0.2em] text-white/40">Why</p>
          <p className="mt-2 text-sm leading-6 text-white/75">{oneLineReason}</p>
        </div>

        <div className="grid gap-3 lg:grid-cols-[1.2fr_0.8fr]">
          <div className="rounded-2xl border border-white/10 bg-black/15 p-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <p className="flex items-center gap-2 text-sm font-medium text-white"><Clipboard className="h-4 w-4" /> Safe response</p>
                <p className="mt-2 text-sm leading-6 text-white/65">“{decision.recommendedResponse}”</p>
              </div>
              <Button type="button" variant="secondary" className="shrink-0 gap-2" onClick={handleCopy}>
                <Copy className="h-4 w-4" />
                {copyState === 'copied' ? 'Copied' : copyState === 'failed' ? 'Copy failed' : 'Copy safe response'}
              </Button>
            </div>
          </div>

          <div className="rounded-2xl border border-white/10 bg-black/15 p-4">
            <p className="flex items-center gap-2 text-sm font-medium text-white"><Eye className="h-4 w-4" /> Do not share</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {decision.doNotShare.map((item) => (
                <span key={item} className="rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-xs text-white/65">{item}</span>
              ))}
            </div>
          </div>
        </div>

        <details className="group rounded-2xl border border-white/10 bg-white/[0.03] p-4" open>
          <summary className="flex cursor-pointer list-none items-center justify-between gap-3 text-sm font-medium text-white">
            <span className="flex items-center gap-2"><ListChecks className="h-4 w-4" /> {detailTitle(decision.riskTier)}</span>
            <span className="text-xs text-white/40 group-open:hidden">Show details</span>
            <span className="text-xs text-white/40 hidden group-open:inline">Hide details</span>
          </summary>

          <div className="mt-4 grid gap-4 lg:grid-cols-3">
            <div className="space-y-3">
              <p className="text-xs uppercase tracking-[0.2em] text-white/35">Why this decision</p>
              <ul className="space-y-2">
                {decision.reasons.map((reason) => (
                  <li key={reason} className="flex gap-2 text-sm leading-5 text-white/65">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-white/35" />
                    <span>{reason}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="space-y-3">
              <p className="text-xs uppercase tracking-[0.2em] text-white/35">Red flags</p>
              <ul className="space-y-2">
                {decision.redFlags.slice(0, 5).map((flag) => (
                  <li key={flag} className="flex gap-2 text-sm leading-5 text-white/65">
                    <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-200/70" />
                    <span>{flag}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="space-y-3">
              <p className="text-xs uppercase tracking-[0.2em] text-white/35">Verification path</p>
              <ol className="space-y-2">
                {path.map((step, index) => (
                  <li key={step} className="flex gap-2 text-sm leading-5 text-white/65">
                    <span className={cn('flex h-5 w-5 shrink-0 items-center justify-center rounded-full border text-[11px]', styles.badge)}>{index + 1}</span>
                    <span>{step}</span>
                  </li>
                ))}
              </ol>
            </div>
          </div>

          <div className="mt-4 rounded-xl border border-white/10 bg-black/10 p-3">
            <p className="text-sm text-white/60"><span className="font-medium text-white/80">Safest next step:</span> {decision.safestNextStep}</p>
          </div>
        </details>

        <p className="text-xs leading-5 text-white/35">{decision.disclaimer} Guidance is deterministic and based on risk signals, trust score, line type, probable intent, and available analysis signals.</p>

        {playbookMatches.length > 0 ? (
          <details className="group rounded-2xl border border-white/10 bg-white/[0.03] p-4">
            <summary className="flex cursor-pointer list-none items-center justify-between gap-3 text-sm font-medium text-white">
              <span>This call pattern resembles:</span>
              <span className="text-xs text-white/40 group-open:hidden">Show</span>
              <span className="text-xs text-white/40 hidden group-open:inline">Hide</span>
            </summary>

            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              {playbookMatches.slice(0, 2).map((match) => (
                <article key={match.slug} className="rounded-2xl border border-white/10 bg-black/15 p-4">
                  <div className="flex items-start justify-between gap-2">
                    <h4 className="text-sm font-semibold text-white">{match.pattern.shortTitle}</h4>
                    <span
                      className={cn(
                        'rounded-full border px-2 py-0.5 text-[11px] font-medium',
                        match.matchStrength === 'strong'
                          ? 'border-amber-300/25 bg-amber-300/10 text-amber-100'
                          : 'border-slate-300/25 bg-slate-300/10 text-slate-100'
                      )}
                    >
                      {match.matchStrength === 'strong' ? 'Strong match' : 'Possible match'}
                    </span>
                  </div>

                  <p className="mt-2 text-sm leading-6 text-white/62">{match.pattern.pressureTactics[0] ?? match.pattern.summary}</p>

                  <div className="mt-3">
                    <div className="flex items-center justify-between text-xs text-white/55">
                      <span>Scam confidence score</span>
                      <span>{match.matchScore}%</span>
                    </div>
                    <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-white/10">
                      <div className={cn('h-full rounded-full', match.matchStrength === 'strong' ? 'bg-amber-300' : 'bg-slate-300')} style={{ width: `${match.matchScore}%` }} />
                    </div>
                  </div>

                  <Link href={`/scams/${match.slug}`} className="mt-4 inline-flex text-xs font-semibold text-cyan-100 transition hover:text-white">
                    View playbook →
                  </Link>
                </article>
              ))}
            </div>
          </details>
        ) : null}
      </div>
    </section>
  );
};
