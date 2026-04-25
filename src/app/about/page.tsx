import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowRight, Radar, ShieldCheck, Workflow } from 'lucide-react';
import { Card } from '@/components/ui/card';

export const metadata: Metadata = {
  title: 'About FilterCalls — Call Intelligence OS',
  description: 'FilterCalls is a privacy-first call intelligence platform for analyzing unknown callers, spam signals, scam risk, and community phone reputation.',
  alternates: { canonical: 'https://filtercalls.com/about' }
};

const stats = [
  ['50+ Countries', 'International calling-code context and country-aware validation.'],
  ['12 Risk Signals', 'Pattern, structure, verification, and trust indicators in one report.'],
  ['Real-time Analysis', 'Instant caller context before you decide how to respond.']
];

const steps = [
  ['Enter a number', 'Paste or type a complete international phone number.'],
  ['Analyze risk signals', 'FilterCalls evaluates structure, validity, provider metadata, and risk patterns.'],
  ['Decide with confidence', 'Use the recommendation to answer, silence, verify, or block.']
];

export default function AboutPage() {
  return (
    <section className="space-y-10">
      <div className="max-w-3xl space-y-4">
        <p className="inline-flex rounded-full border border-violet-400/20 bg-violet-400/10 px-3 py-1 text-xs font-medium uppercase tracking-[0.2em] text-violet-200">About FilterCalls</p>
        <h1 className="text-4xl font-semibold tracking-tight text-white md:text-5xl">Caller Intelligence, Not Just Caller ID</h1>
        <p className="text-lg text-white/60">FilterCalls gives every inbound call a risk score, a trust signal, and a recommended action — instantly.</p>
      </div>

      <div className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
        <Card className="space-y-4 border border-white/10 bg-white/[0.03]">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-violet-400/20 bg-violet-400/10 text-violet-200"><Radar className="h-5 w-5" /></div>
          <p className="text-sm leading-6 text-white/60">
            FilterCalls turns unknown phone numbers into structured caller context. The platform combines deterministic phone-number analysis with optional carrier, line-type, and region metadata through external verification providers such as APILayer.
          </p>
          <p className="text-sm leading-6 text-white/60">
            The goal is simple: reduce spam, fraud, wasted callbacks, and uncertainty. Instead of relying on instinct, individuals and teams get a clear risk score, trust score, signal breakdown, and recommended action before they respond.
          </p>
        </Card>

        <Card className="space-y-4 border border-white/10 bg-gradient-to-b from-violet-500/10 to-indigo-500/5">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-emerald-400/20 bg-emerald-400/10 text-emerald-200"><ShieldCheck className="h-5 w-5" /></div>
          <h2 className="text-xl font-semibold text-white">Built for calm, practical decisions</h2>
          <p className="text-sm leading-6 text-white/60">FilterCalls does not pretend every call is obviously safe or dangerous. It surfaces uncertainty, highlights the strongest signals, and helps you choose the safest next step.</p>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {stats.map(([title, text]) => (
          <Card key={title} className="border border-white/10 bg-white/[0.03]">
            <p className="text-2xl font-semibold text-white">{title}</p>
            <p className="mt-2 text-sm text-white/50">{text}</p>
          </Card>
        ))}
      </div>

      <div className="space-y-4">
        <div className="flex items-center gap-2 text-white"><Workflow className="h-5 w-5 text-violet-200" /><h2 className="text-2xl font-semibold">How it works</h2></div>
        <div className="grid gap-4 md:grid-cols-3">
          {steps.map(([title, text], index) => (
            <Card key={title} className="border border-white/10 bg-white/[0.03]">
              <span className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-violet-400/20 bg-violet-400/10 text-sm font-semibold text-violet-200">{index + 1}</span>
              <h3 className="mt-4 font-semibold text-white">{title}</h3>
              <p className="mt-2 text-sm text-white/50">{text}</p>
            </Card>
          ))}
        </div>
      </div>

      <Card className="flex flex-col gap-4 border border-violet-400/20 bg-gradient-to-r from-violet-500/10 to-indigo-500/10 p-6 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-semibold text-white">Ready to identify unknown callers?</h2>
          <p className="mt-1 text-sm text-white/50">Run your first report in seconds.</p>
        </div>
        <Link href="/analysis" className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 px-4 py-2 text-sm font-medium text-white">
          Analyze a number free <ArrowRight className="h-4 w-4" />
        </Link>
      </Card>
    </section>
  );
}
