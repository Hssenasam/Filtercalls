import Link from 'next/link';
import { BarChart3, Globe2, ShieldCheck, TrendingUp } from 'lucide-react';
import { Card } from '@/components/ui/card';
import type { PublicInsights } from '@/lib/reputation/types';

export const runtime = 'edge';
export const revalidate = 120;

const empty: PublicInsights = {
  total_reports: 0,
  recent_activity_24h: 0,
  top_categories: [],
  severity_mix: [],
  risk_trend: { high_risk_reports_24h: 0, critical_reports_24h: 0 },
  top_countries: []
};

const getInsights = async () => {
  try {
    const base = process.env.PORTAL_BASE_URL ?? 'https://filtercalls.com';
    const response = await fetch(`${base}/api/insights/public`, { next: { revalidate: 120 } });
    if (!response.ok) return empty;
    return (await response.json()) as PublicInsights;
  } catch {
    return empty;
  }
};

export default async function InsightsPage() {
  const data = await getInsights();
  const maxCategory = Math.max(1, ...data.top_categories.map((item) => item.count));
  const maxSeverity = Math.max(1, ...data.severity_mix.map((item) => item.count));
  const totalCategory = Math.max(1, data.top_categories.reduce((sum, item) => sum + item.count, 0));

  return (
    <section className="space-y-10">
      <div className="max-w-3xl space-y-4">
        <p className="inline-flex rounded-full border border-violet-400/20 bg-violet-400/10 px-3 py-1 text-xs font-medium uppercase tracking-[0.2em] text-violet-200">Public Intelligence</p>
        <h1 className="text-4xl font-semibold tracking-tight text-white md:text-5xl">Global Caller Reputation Intelligence</h1>
        <p className="text-lg text-white/55">Community reports, risk patterns, and verified caller signals — built with privacy-first phone-number hashing.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        {[
          ['Total community reports', data.total_reports],
          ['Reports in last 24h', data.recent_activity_24h],
          ['High-risk today', data.risk_trend.high_risk_reports_24h],
          ['Critical today', data.risk_trend.critical_reports_24h]
        ].map(([label, value]) => (
          <Card key={label} className="border border-white/10 bg-white/[0.03]">
            <p className="text-xs text-white/40">{label}</p>
            <p className="mt-2 text-3xl font-semibold text-white">{value}</p>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
        <Card className="space-y-4 border border-white/10 bg-white/[0.03]">
          <h2 className="flex items-center gap-2 text-2xl font-semibold text-white"><BarChart3 className="h-5 w-5 text-violet-200" /> Top categories</h2>
          {data.top_categories.length ? data.top_categories.map((item) => (
            <div key={item.category} className="space-y-2">
              <div className="flex justify-between text-sm"><span className="capitalize text-white/70">{item.category}</span><span className="text-white/40">{item.count} · {Math.round((item.count / totalCategory) * 100)}%</span></div>
              <div className="h-2 overflow-hidden rounded-full bg-white/10"><div className="h-full rounded-full bg-violet-400" style={{ width: `${(item.count / maxCategory) * 100}%` }} /></div>
            </div>
          )) : <p className="text-sm text-white/45">Community intelligence is warming up. Analyze and report a number to contribute.</p>}
        </Card>

        <Card className="space-y-4 border border-white/10 bg-white/[0.03]">
          <h2 className="flex items-center gap-2 text-2xl font-semibold text-white"><Globe2 className="h-5 w-5 text-cyan-200" /> Top countries</h2>
          {data.top_countries.length ? data.top_countries.map((item) => (
            <div key={item.country_code} className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3"><span className="font-medium text-white">{item.country_code}</span><span className="text-sm text-white/45">{item.count} reports</span></div>
          )) : <p className="text-sm text-white/45">Country data warming up...</p>}
        </Card>
      </div>

      <Card className="space-y-4 border border-white/10 bg-white/[0.03]">
        <h2 className="flex items-center gap-2 text-2xl font-semibold text-white"><TrendingUp className="h-5 w-5 text-amber-200" /> Severity mix</h2>
        <div className="grid gap-3 md:grid-cols-4">
          {['low', 'medium', 'high', 'critical'].map((severity) => {
            const found = data.severity_mix.find((item) => item.severity === severity);
            const count = found?.count ?? 0;
            return (
              <div key={severity} className="rounded-2xl border border-white/10 bg-black/10 p-4">
                <p className="text-sm capitalize text-white/50">{severity}</p>
                <p className="mt-2 text-2xl font-semibold text-white">{count}</p>
                <div className="mt-3 h-2 overflow-hidden rounded-full bg-white/10"><div className="h-full rounded-full bg-cyan-400" style={{ width: `${(count / maxSeverity) * 100}%` }} /></div>
              </div>
            );
          })}
        </div>
      </Card>

      <Card className="space-y-3 border border-emerald-400/20 bg-emerald-400/[0.04]">
        <h2 className="flex items-center gap-2 text-2xl font-semibold text-white"><ShieldCheck className="h-5 w-5 text-emerald-200" /> Privacy by design</h2>
        <ul className="grid gap-2 text-sm text-white/55 md:grid-cols-2">
          <li>• Phone numbers are SHA-256 hashed before storage.</li>
          <li>• Raw numbers are never stored or shown publicly.</li>
          <li>• Community reports are aggregated only.</li>
          <li>• Reporter identity is never exposed.</li>
        </ul>
      </Card>

      <div className="flex flex-col gap-3 sm:flex-row">
        <Link href="/analysis" className="inline-flex justify-center rounded-xl bg-violet-600 px-5 py-3 text-sm font-medium text-white">Analyze a number →</Link>
        <Link href="/analysis" className="inline-flex justify-center rounded-xl border border-white/10 bg-white/[0.05] px-5 py-3 text-sm font-medium text-white/80">Report suspicious activity →</Link>
      </div>
    </section>
  );
}
