import Link from 'next/link';
import { ArrowRight, BarChart3, Globe2, Radar, ShieldAlert } from 'lucide-react';
import { Card } from '@/components/ui/card';

const stats = [
  ['0', 'Community Reports', 'Community reputation data will appear after launch.', ShieldAlert],
  ['0', 'Verified Numbers', 'Verified public reputation entries are coming soon.', Radar],
  ['50+', 'Countries', 'Country-aware phone context and validation.', Globe2],
  ['12', 'Threat Patterns', 'Signals designed to identify suspicious call behavior.', BarChart3]
];

const categories = ['spam', 'scam', 'robocall', 'telemarketing', 'unknown'];

export default function InsightsPage() {
  return (
    <section className="space-y-10">
      <div className="max-w-3xl space-y-4">
        <p className="inline-flex rounded-full border border-indigo-400/20 bg-indigo-400/10 px-3 py-1 text-xs font-medium uppercase tracking-[0.2em] text-indigo-200">Insights</p>
        <h1 className="text-4xl font-semibold tracking-tight text-white md:text-5xl">Global Call Intelligence</h1>
        <p className="text-lg text-white/60">Community-powered threat data and caller reputation signals across 50+ countries. Community reports coming soon.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {stats.map(([value, label, description, Icon]) => (
          <Card key={label as string} className="border border-white/10 bg-white/[0.03]">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-3xl font-semibold text-white">{value as string}</p>
                <p className="mt-1 text-sm font-medium text-white/80">{label as string}</p>
              </div>
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl border border-violet-400/20 bg-violet-400/10 text-violet-200"><Icon className="h-5 w-5" /></div>
            </div>
            <p className="mt-4 text-sm text-white/45">{description as string}</p>
          </Card>
        ))}
      </div>

      <Card className="space-y-5 border border-white/10 bg-white/[0.03]">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="text-2xl font-semibold text-white">Top Threat Categories</h2>
            <p className="mt-1 text-sm text-white/45">Live community data will appear here after the reputation network launches.</p>
          </div>
          <span className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-xs text-white/45">0 reports</span>
        </div>

        <div className="space-y-3">
          {categories.map((category) => (
            <div key={category} className="grid gap-2 sm:grid-cols-[140px_1fr_80px] sm:items-center">
              <p className="text-sm font-medium capitalize text-white/75">{category}</p>
              <div className="h-2 overflow-hidden rounded-full bg-white/10">
                <div className="h-full w-0 rounded-full bg-gradient-to-r from-violet-500 to-indigo-500" />
              </div>
              <p className="text-sm text-white/40 sm:text-right">0 reports</p>
            </div>
          ))}
        </div>
      </Card>

      <Card className="flex flex-col gap-4 border border-violet-400/20 bg-gradient-to-r from-violet-500/10 to-indigo-500/10 p-6 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-semibold text-white">Need context on a caller now?</h2>
          <p className="mt-1 text-sm text-white/50">Run a number through the analysis workspace.</p>
        </div>
        <Link href="/analysis" className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 px-4 py-2 text-sm font-medium text-white">
          Analyze a number <ArrowRight className="h-4 w-4" />
        </Link>
      </Card>
    </section>
  );
}
