import Link from 'next/link';
import type { Metadata } from 'next';
import { Card } from '@/components/ui/card';

export const runtime = 'edge';

export const metadata: Metadata = {
  title: 'Features — FilterCalls',
  description: 'Explore FilterCalls features: call intelligence scoring, scam playbooks, safe reporting workflows, API docs, and privacy-first protection.',
  alternates: { canonical: 'https://filtercalls.com/features' },
  openGraph: {
    title: 'Features — FilterCalls',
    description: 'Call intelligence before you answer: risk scoring, trust signals, scam guidance, and developer-ready workflows.',
    url: 'https://filtercalls.com/features',
    type: 'website',
    siteName: 'FilterCalls'
  }
};

export default function FeaturesPage() {
  return (
    <section className="space-y-10">
      <div className="max-w-3xl space-y-4">
        <p className="inline-flex rounded-full border border-violet-400/20 bg-violet-400/10 px-3 py-1 text-xs font-medium uppercase tracking-[0.2em] text-violet-200">Features</p>
        <h1 className="text-4xl font-semibold tracking-tight text-white md:text-5xl">Call intelligence before you answer.</h1>
        <p className="text-lg text-white/60">FilterCalls combines spam detection, trust scoring, scam playbooks, and developer-ready reporting to help people and teams make safer call decisions.</p>
        <div className="flex flex-wrap gap-3 pt-2">
          <Link href="/analysis" className="inline-flex items-center justify-center rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 px-4 py-2 text-sm font-medium text-white">Analyze a number</Link>
          <Link href="/scams" className="inline-flex items-center justify-center rounded-xl border border-white/10 bg-white/[0.04] px-4 py-2 text-sm font-medium text-white/80 hover:bg-white/[0.08]">View scam intelligence</Link>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="border border-white/10 bg-white/[0.03]">
          <h2 className="text-2xl font-semibold text-white">Phone intelligence</h2>
          <ul className="mt-4 space-y-2 text-sm text-white/65">
            <li>• Risk score to estimate likely threat level.</li>
            <li>• Trust score to separate likely legitimate callers from unknown risk.</li>
            <li>• Country, region, and carrier context when available.</li>
            <li>• Community reputation signals from aggregated reporting.</li>
          </ul>
        </Card>

        <Card className="border border-white/10 bg-white/[0.03]">
          <h2 className="text-2xl font-semibold text-white">Scam protection</h2>
          <ul className="mt-4 space-y-2 text-sm text-white/65">
            <li>• Scam playbooks that explain common fraud patterns.</li>
            <li>• Recipient-friendly report sharing for non-technical readers.</li>
            <li>• Safe callback guidance and verification paths.</li>
            <li>• Clear do-not-share safety reminders.</li>
          </ul>
        </Card>

        <Card className="border border-white/10 bg-white/[0.03]">
          <h2 className="text-2xl font-semibold text-white">Developer and workflow fit</h2>
          <ul className="mt-4 space-y-2 text-sm text-white/65">
            <li>• API docs for structured call intelligence outputs.</li>
            <li>• Webhook support for downstream automation.</li>
            <li>• PDF/report sharing for operational handoff.</li>
            <li>• Usage-ready primitives for support and security processes.</li>
          </ul>
        </Card>

        <Card className="border border-white/10 bg-white/[0.03]">
          <h2 className="text-2xl font-semibold text-white">Privacy-first foundation</h2>
          <ul className="mt-4 space-y-2 text-sm text-white/65">
            <li>• Number hashing in community reputation flows.</li>
            <li>• Public report pages avoid raw phone-number exposure.</li>
            <li>• Shared report experiences rely on masked previews.</li>
            <li>• Safety messaging designed for real-world sharing.</li>
          </ul>
        </Card>
      </div>

      <Card className="border border-white/10 bg-white/[0.03]">
        <h2 className="text-xl font-semibold text-white">Explore next</h2>
        <div className="mt-4 flex flex-wrap gap-3 text-sm">
          <Link href="/analysis" className="rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2 text-white/80 hover:bg-white/[0.08]">/analysis</Link>
          <Link href="/scams" className="rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2 text-white/80 hover:bg-white/[0.08]">/scams</Link>
          <Link href="/api-docs" className="rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2 text-white/80 hover:bg-white/[0.08]">/api-docs</Link>
          <Link href="/security" className="rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2 text-white/80 hover:bg-white/[0.08]">/security</Link>
          <Link href="/pricing" className="rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2 text-white/80 hover:bg-white/[0.08]">/pricing</Link>
        </div>
      </Card>
    </section>
  );
}
