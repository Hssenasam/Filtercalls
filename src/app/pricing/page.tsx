import Link from 'next/link';
import { CheckCircle2, HelpCircle, Sparkles } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { PLAN_DEFINITIONS } from '@/lib/billing/plans';

const freeFeatures = [
  '20 analyses per month',
  'Basic risk signal detection',
  'Public analysis workspace',
  'Copy report link',
  'Email support'
];

const proFeatures = [
  '500 analyses per month',
  'APILayer carrier + region verification',
  'Line type detection: mobile / VoIP / landline',
  '5 API keys',
  'Webhooks',
  'Priority support'
];

const faqs = [
  ['Can I cancel anytime?', 'Yes. Cancel from your portal. No commitments.'],
  ['What happens when I hit the limit?', 'Analysis is paused until the next billing cycle. Upgrade to Pro for higher usage.'],
  ['Is my data private?', 'FilterCalls is designed to minimize sensitive storage and avoid exposing raw phone data publicly.']
];

const FeatureList = ({ features }: { features: string[] }) => (
  <ul className="space-y-2 text-sm text-white/65">
    {features.map((feature) => (
      <li key={feature} className="flex items-start gap-2">
        <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-300" />
        <span>{feature}</span>
      </li>
    ))}
  </ul>
);

export default function PricingPage() {
  const free = PLAN_DEFINITIONS.free;
  const pro = PLAN_DEFINITIONS.pro;

  return (
    <section className="space-y-10">
      <div className="max-w-3xl space-y-3">
        <p className="inline-flex rounded-full border border-violet-400/20 bg-violet-400/10 px-3 py-1 text-xs font-medium uppercase tracking-[0.2em] text-violet-200">Pricing</p>
        <h1 className="text-4xl font-semibold tracking-tight text-white md:text-5xl">Simple, transparent pricing. No hidden fees.</h1>
        <p className="text-sm text-white/50">Start free, upgrade when you need deeper verification, more analyses, API keys, and workflow automation.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card className="space-y-5 border border-white/10 bg-white/[0.03]">
          <div>
            <p className="text-sm text-white/50">{free.label}</p>
            <p className="mt-1 text-3xl font-semibold text-white">${free.monthlyPriceUsd} <span className="text-sm font-normal text-white/45">/ month</span></p>
          </div>

          <FeatureList features={freeFeatures} />

          <Link href="/analysis" className="inline-flex w-full items-center justify-center rounded-xl border border-white/10 bg-white/[0.05] px-4 py-2 text-sm text-white/80 hover:bg-white/[0.08]">
            Analyze now
          </Link>
        </Card>

        <Card className="relative space-y-5 overflow-hidden border border-violet-500/25 bg-gradient-to-b from-violet-500/12 to-indigo-500/5">
          <div className="absolute right-4 top-4 inline-flex items-center gap-1 rounded-full border border-violet-300/25 bg-violet-300/10 px-3 py-1 text-xs font-medium text-violet-100">
            <Sparkles className="h-3.5 w-3.5" /> Most popular
          </div>
          <div>
            <p className="text-sm text-violet-300/80">{pro.label}</p>
            <p className="mt-1 text-3xl font-semibold text-white">${pro.monthlyPriceUsd} <span className="text-sm font-normal text-white/45">/ month</span></p>
          </div>

          <FeatureList features={proFeatures} />

          <Link href="/login" className="inline-flex w-full items-center justify-center rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-lg shadow-violet-950/30">
            Get Pro
          </Link>
        </Card>
      </div>

      <div className="space-y-4">
        <div className="flex items-center gap-2 text-white"><HelpCircle className="h-5 w-5 text-violet-200" /><h2 className="text-2xl font-semibold">Questions before upgrading?</h2></div>
        <div className="grid gap-4 md:grid-cols-3">
          {faqs.map(([question, answer]) => (
            <Card key={question} className="border border-white/10 bg-white/[0.03]">
              <h3 className="font-semibold text-white">{question}</h3>
              <p className="mt-2 text-sm text-white/50">{answer}</p>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
