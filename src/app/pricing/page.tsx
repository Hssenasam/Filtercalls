import Link from 'next/link';
import { Card } from '@/components/ui/card';
import { PLAN_DEFINITIONS } from '@/lib/billing/plans';

export default function PricingPage() {
  const free = PLAN_DEFINITIONS.free;
  const pro = PLAN_DEFINITIONS.pro;

  return (
    <section className="space-y-10">
      <div className="space-y-3">
        <h1 className="text-3xl font-semibold text-white">Pricing</h1>
        <p className="text-sm text-white/45">
          One simple plan structure. Start free, upgrade when your usage grows.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card className="space-y-4 border border-white/10 bg-white/[0.03]">
          <div>
            <p className="text-sm text-white/50">{free.label}</p>
            <p className="mt-1 text-2xl font-semibold text-white">${free.monthlyPriceUsd} / month</p>
          </div>

          <ul className="space-y-2 text-sm text-white/55">
            <li>{free.limits.monthlyAnalyses.toLocaleString()} analyses / month</li>
            <li>{free.limits.apiKeys} API keys</li>
            <li>{free.limits.webhooks} webhook</li>
          </ul>

          <Link href="/analysis" className="inline-flex items-center justify-center rounded-xl border border-white/10 bg-white/[0.05] px-4 py-2 text-sm text-white/80 hover:bg-white/[0.08]">
            Analyze now
          </Link>
        </Card>

        <Card className="space-y-4 border border-violet-500/20 bg-gradient-to-b from-violet-500/10 to-indigo-500/5">
          <div>
            <p className="text-sm text-violet-300/80">{pro.label}</p>
            <p className="mt-1 text-2xl font-semibold text-white">${pro.monthlyPriceUsd} / month</p>
          </div>

          <ul className="space-y-2 text-sm text-white/70">
            <li>{pro.limits.monthlyAnalyses.toLocaleString()} analyses / month</li>
            <li>{pro.limits.apiKeys} API keys</li>
            <li>{pro.limits.webhooks} webhooks</li>
          </ul>

          <Link href="/login" className="inline-flex items-center justify-center rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 px-4 py-2 text-sm font-medium text-white">
            Get Pro
          </Link>
        </Card>
      </div>
    </section>
  );
}
