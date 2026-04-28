import Link from 'next/link';
import type { Metadata } from 'next';
import { Card } from '@/components/ui/card';

export const runtime = 'edge';

export const metadata: Metadata = {
  title: 'Reports — FilterCalls',
  description: 'Start with number analysis to generate a shareable public report. Use /report/[hash] links for completed reports.',
  alternates: { canonical: 'https://filtercalls.com/report' },
  openGraph: {
    title: 'Reports — FilterCalls',
    description: 'Reports are generated after a completed phone intelligence analysis.',
    url: 'https://filtercalls.com/report',
    type: 'website',
    siteName: 'FilterCalls'
  }
};

export default function ReportLandingPage() {
  return (
    <section className="space-y-8">
      <div className="max-w-3xl space-y-4">
        <p className="inline-flex rounded-full border border-violet-400/20 bg-violet-400/10 px-3 py-1 text-xs font-medium uppercase tracking-[0.2em] text-violet-200">Reports</p>
        <h1 className="text-4xl font-semibold tracking-tight text-white md:text-5xl">Reports are created after analyzing a number.</h1>
        <p className="text-lg text-white/60">FilterCalls public reports are generated from a completed phone intelligence analysis. Start with a suspicious number, then share the report when it is ready.</p>
      </div>

      <Card className="border border-white/10 bg-white/[0.03]">
        <div className="flex flex-wrap gap-3">
          <Link href="/analysis" className="inline-flex items-center justify-center rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 px-4 py-2 text-sm font-medium text-white">Analyze a number</Link>
          <Link href="/features" className="inline-flex items-center justify-center rounded-xl border border-white/10 bg-white/[0.04] px-4 py-2 text-sm font-medium text-white/80 hover:bg-white/[0.08]">Learn about recipient-friendly reports</Link>
          <Link href="/scams" className="inline-flex items-center justify-center rounded-xl border border-white/10 bg-white/[0.04] px-4 py-2 text-sm font-medium text-white/80 hover:bg-white/[0.08]">Explore scam playbooks</Link>
        </div>
      </Card>

      <Card className="border border-white/10 bg-white/[0.03]">
        <h2 className="text-xl font-semibold text-white">How report links work</h2>
        <ul className="mt-4 space-y-2 text-sm text-white/65">
          <li>• Completed public reports use links in the format <span className="font-mono text-white/80">/report/[hash]</span>.</li>
          <li>• Recipient-safe views can use the query param <span className="font-mono text-white/80">?view=recipient</span>.</li>
          <li>• Public report pages use masked previews and avoid exposing raw phone numbers.</li>
        </ul>
      </Card>
    </section>
  );
}
