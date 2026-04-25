import Link from 'next/link';
import { ShieldCheck, Activity, Globe2 } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { ShareActions } from '@/components/reputation/share-actions';
import type { ReputationSummary } from '@/lib/reputation/types';

export const runtime = 'edge';

const emptySummary: ReputationSummary = {
  has_community_data: false,
  total: 0,
  reputation_score: 0,
  risk_label: 'clean',
  top_category: null,
  breakdown: { scam: 0, spam: 0, robocall: 0, telemarketing: 0, suspicious: 0, safe: 0, business: 0, delivery: 0, recruiter: 0, unknown: 0 },
  severity: { low: 0, medium: 0, high: 0, critical: 0 },
  recent_reports_24h: 0,
  activity_7d: [],
  last_reported_at: null,
  confidence: 0,
  verified_report_count: 0,
  country_code: null,
  number_hash_preview: null
};

const getSummary = async (hash: string) => {
  try {
    const base = process.env.PORTAL_BASE_URL ?? 'https://filtercalls.com';
    const response = await fetch(`${base}/api/reports/public/${encodeURIComponent(hash)}`, { next: { revalidate: 120 } });
    if (!response.ok) return emptySummary;
    return (await response.json()) as ReputationSummary;
  } catch {
    return emptySummary;
  }
};

export default async function PublicReportPage({ params }: { params: { hash: string } }) {
  const summary = await getSummary(params.hash);
  const url = `https://filtercalls.com/report/${params.hash}`;
  const maxActivity = Math.max(1, ...summary.activity_7d.map((point) => point.count));
  const nonZero = Object.entries(summary.breakdown).filter(([, count]) => count > 0);

  return (
    <section className="space-y-8">
      <div className="space-y-4">
        <p className="inline-flex rounded-full border border-violet-400/20 bg-violet-400/10 px-3 py-1 text-xs font-medium uppercase tracking-[0.2em] text-violet-200">Public Report</p>
        <h1 className="text-4xl font-semibold tracking-tight text-white md:text-5xl">Caller Reputation Report</h1>
        <p className="max-w-2xl text-white/55">Privacy-first community intelligence from FilterCalls. This page never exposes the raw phone number or individual reporter details.</p>
      </div>

      <Card className="space-y-5 border border-white/10 bg-white/[0.03]">
        {summary.has_community_data ? (
          <>
            <div className="grid gap-3 sm:grid-cols-4">
              <div className="rounded-2xl border border-white/10 bg-black/10 p-4"><p className="text-xs text-white/40">Reputation score</p><p className="mt-1 text-3xl font-semibold text-white">{summary.reputation_score}</p></div>
              <div className="rounded-2xl border border-white/10 bg-black/10 p-4"><p className="text-xs text-white/40">Risk label</p><p className="mt-1 text-xl font-semibold capitalize text-white">{summary.risk_label.replace('_', ' ')}</p></div>
              <div className="rounded-2xl border border-white/10 bg-black/10 p-4"><p className="text-xs text-white/40">Reports</p><p className="mt-1 text-3xl font-semibold text-white">{summary.total}</p></div>
              <div className="rounded-2xl border border-white/10 bg-black/10 p-4"><p className="text-xs text-white/40">Verified</p><p className="mt-1 text-3xl font-semibold text-white">{summary.verified_report_count}</p></div>
            </div>

            <div className="flex flex-wrap gap-2">
              {summary.top_category ? <span className="rounded-full border border-violet-300/20 bg-violet-300/10 px-3 py-1 text-sm text-violet-100">Top: {summary.top_category}</span> : null}
              {summary.country_code ? <span className="rounded-full border border-cyan-300/20 bg-cyan-300/10 px-3 py-1 text-sm text-cyan-100"><Globe2 className="mr-1 inline h-3.5 w-3.5" /> {summary.country_code}</span> : null}
              {nonZero.map(([category, count]) => <span key={category} className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-sm text-white/60">{category}: {count}</span>)}
            </div>

            {summary.activity_7d.some((point) => point.count > 0) ? (
              <div className="rounded-2xl border border-white/10 bg-black/10 p-4">
                <p className="mb-3 flex items-center gap-2 text-sm font-medium text-white"><Activity className="h-4 w-4 text-violet-200" /> Activity — last 7 days</p>
                <div className="flex h-28 items-end gap-2">
                  {summary.activity_7d.map((point) => <div key={point.day} className="flex flex-1 flex-col items-center gap-2"><div className="w-full rounded-t-lg bg-violet-400/60" style={{ height: `${Math.max(8, (point.count / maxActivity) * 90)}px` }} /><span className="text-[10px] text-white/35">{new Date(point.day).toLocaleDateString('en-US', { weekday: 'short' }).slice(0, 1)}</span></div>)}
                </div>
              </div>
            ) : null}
          </>
        ) : (
          <div className="py-10 text-center"><ShieldCheck className="mx-auto h-10 w-10 text-violet-200" /><h2 className="mt-4 text-2xl font-semibold text-white">No community reputation found yet.</h2><p className="mt-2 text-sm text-white/50">Analyze and report suspicious activity to help this reputation page grow.</p></div>
        )}
      </Card>

      <Card className="space-y-4 border border-white/10 bg-white/[0.03]">
        <h2 className="text-xl font-semibold text-white">Share this public report</h2>
        <ShareActions url={url} />
      </Card>

      <div className="flex flex-col gap-3 sm:flex-row">
        <Link href="/analysis" className="inline-flex justify-center rounded-xl bg-violet-600 px-5 py-3 text-sm font-medium text-white">Analyze a number →</Link>
        <Link href="/analysis" className="inline-flex justify-center rounded-xl border border-white/10 bg-white/[0.05] px-5 py-3 text-sm font-medium text-white/80">Report suspicious activity →</Link>
      </div>
    </section>
  );
}
