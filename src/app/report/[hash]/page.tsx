import Link from 'next/link';
import type { Metadata } from 'next';
import { ShieldCheck, Activity, Globe2 } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { ShareActions } from '@/components/reputation/share-actions';
import type { ReputationSummary, RiskLabel } from '@/lib/reputation/types';
import {
  parseViewMode,
  recipientDoNotShare,
  recipientHeadline,
  recipientSafeResponse,
  recipientSteps,
  recipientVerifyPath,
  recommendedPlaybookSlug
} from '@/lib/report/public-report-view';

export const runtime = 'edge';

const SITE_URL = 'https://filtercalls.com';
const PAGE_TITLE = 'Caller Reputation Report · FilterCalls';

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
    const base = process.env.PORTAL_BASE_URL ?? SITE_URL;
    const response = await fetch(`${base}/api/reports/public/${encodeURIComponent(hash)}`, { next: { revalidate: 120 } });
    if (!response.ok) return emptySummary;
    return (await response.json()) as ReputationSummary;
  } catch {
    return emptySummary;
  }
};

const riskTone = (riskLabel: RiskLabel | null | undefined) => {
  switch (riskLabel) {
    case 'clean':
      return { border: 'border-emerald-400/30', bg: 'bg-emerald-400/10', text: 'text-emerald-200', bar: 'bg-emerald-400', barSoft: 'bg-emerald-400/80' };
    case 'watch':
      return { border: 'border-amber-400/30', bg: 'bg-amber-400/10', text: 'text-amber-200', bar: 'bg-amber-400', barSoft: 'bg-amber-400/80' };
    case 'suspicious':
      return { border: 'border-orange-400/30', bg: 'bg-orange-400/10', text: 'text-orange-200', bar: 'bg-orange-400', barSoft: 'bg-orange-400/80' };
    case 'high_risk':
      return { border: 'border-red-400/30', bg: 'bg-red-400/10', text: 'text-red-200', bar: 'bg-red-400', barSoft: 'bg-red-400/80' };
    default:
      return { border: 'border-white/15', bg: 'bg-white/5', text: 'text-white/70', bar: 'bg-white/40', barSoft: 'bg-white/40' };
  }
};

const riskBannerText = (summary: ReputationSummary) => {
  if (!summary.has_community_data || summary.total <= 0) return '🔍 No community reputation data yet for this caller.';
  switch (summary.risk_label) {
    case 'clean':
      return '✓ No significant risk signals detected from the community.';
    case 'watch':
      return '⚠ Some caution signals reported by the community.';
    case 'suspicious':
      return '⚠ Elevated risk signals. Exercise caution.';
    case 'high_risk':
      return '🚨 High risk signals reported. Do not share personal or financial information.';
    default:
      return '🔍 No community reputation data yet for this caller.';
  }
};

const recommendedAction = (summary: ReputationSummary) => {
  if (!summary.has_community_data || summary.total <= 0) {
    return {
      icon: '🔍',
      title: 'No Data Yet',
      tips: [
        'No community reports have been submitted yet.',
        'Analyze this number for a full intelligence report.',
        'Report suspicious activity to help build the reputation network.'
      ]
    };
  }

  switch (summary.risk_label) {
    case 'high_risk':
      return {
        icon: '🚫',
        title: 'High Risk — Do Not Answer',
        tips: [
          'Do not share personal, payment, or login information.',
          'Let the call go to voicemail and verify through official channels.',
          'Report this caller to help protect others.'
        ]
      };
    case 'suspicious':
      return {
        icon: '⚠️',
        title: 'Suspicious — Verify First',
        tips: [
          'Ask the caller to verify their identity.',
          'Do not share payment details or one-time codes.',
          'Call back using an official published number.'
        ]
      };
    case 'watch':
      return {
        icon: '⚠',
        title: 'Caution — Use Verification',
        tips: [
          'The caller may be legitimate, but caution signals exist.',
          'Verify the organization before continuing.',
          'Avoid sharing sensitive information until confirmed.'
        ]
      };
    case 'clean':
    default:
      return {
        icon: '✅',
        title: 'Likely Safe',
        tips: [
          'No significant community risk signals detected.',
          'Continue normal caution with unknown callers.',
          'Report unusual behavior if the caller becomes suspicious.'
        ]
      };
  }
};

const relativeLastReported = (timestamp: number | null) => {
  if (!timestamp) return 'No reports yet';
  const now = Date.now();
  const diffDays = Math.floor((now - timestamp) / (24 * 60 * 60 * 1000));
  if (diffDays <= 0) return 'Last reported: today';
  if (diffDays <= 7) return `Last reported: ${diffDays} day${diffDays === 1 ? '' : 's'} ago`;
  return `Last reported: ${new Date(timestamp).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`;
};

export async function generateMetadata({ params }: { params: { hash: string } }): Promise<Metadata> {
  const summary = await getSummary(params.hash);
  const hasData = summary.has_community_data && summary.total > 0;
  const canonical = `${SITE_URL}/report/${params.hash}`;

  const description = hasData
    ? `Community risk signals, spam reports, and trust intelligence for this caller. ${summary.total} community reports · Risk: ${summary.risk_label} · Privacy-first caller intelligence by FilterCalls.`
    : 'No community reports yet for this caller. Analyze and report suspicious numbers with FilterCalls privacy-first call intelligence.';

  return {
    title: PAGE_TITLE,
    description,
    alternates: { canonical },
    robots: { index: hasData, follow: hasData },
    openGraph: {
      title: PAGE_TITLE,
      description,
      url: canonical,
      siteName: 'FilterCalls',
      type: 'website'
    },
    twitter: {
      card: 'summary',
      title: PAGE_TITLE,
      description
    }
  };
}

export default async function PublicReportPage({
  params,
  searchParams
}: {
  params: { hash: string };
  searchParams?: { viewMode?: string | string[] };
}) {
  const summary = await getSummary(params.hash);
  const hasData = summary.has_community_data && summary.total > 0;
  const viewMode = parseViewMode(searchParams?.viewMode);
  const url = `${SITE_URL}/report/${params.hash}`;
  const tone = riskTone(hasData ? summary.risk_label : null);
  const maxActivity = Math.max(1, ...summary.activity_7d.map((point) => point.count));
  const nonZeroCategories = Object.entries(summary.breakdown).filter(([, count]) => count > 0);
  const maxCategoryCount = Math.max(1, ...nonZeroCategories.map(([, count]) => count));
  const severityRows = (['critical', 'high', 'medium', 'low'] as const).map((level) => ({ level, count: summary.severity[level] ?? 0 })).filter((row) => row.count > 0);
  const maxSeverityCount = Math.max(1, ...severityRows.map((row) => row.count));
  const action = recommendedAction(summary);
  const playbookSlug = recommendedPlaybookSlug(summary);
  const reportShareCopy = `${recipientHeadline(summary.risk_label, hasData)}\n${recipientSteps(summary.risk_label).slice(0, 2).join('\n')}\nVerify through official channels only.\n${url}?viewMode=recipient`;

  const jsonLd = hasData
    ? {
      '@context': 'https://schema.org',
      '@type': 'WebPage',
      name: PAGE_TITLE,
      description: 'Privacy-first community caller reputation intelligence.',
      url,
      publisher: {
        '@type': 'Organization',
        name: 'FilterCalls',
        url: SITE_URL
      },
      breadcrumb: {
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Home', item: SITE_URL },
          { '@type': 'ListItem', position: 2, name: 'Insights', item: `${SITE_URL}/insights` },
          { '@type': 'ListItem', position: 3, name: 'Report', item: url }
        ]
      }
    }
    : null;

  return (
    <section className="space-y-8">
      {jsonLd ? <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} /> : null}

      <div className="space-y-4">
        <p className="inline-flex rounded-full border border-violet-400/20 bg-violet-400/10 px-3 py-1 text-xs font-medium uppercase tracking-[0.2em] text-violet-200">Public Report</p>
        <h1 className="text-4xl font-semibold tracking-tight text-white md:text-5xl">
          {viewMode === 'recipient' ? 'What should I do about this caller?' : 'Caller Reputation Intelligence'}
        </h1>
        <p className="max-w-3xl text-white/55">
          {viewMode === 'recipient'
            ? 'This version is simplified for a shared recipient. Follow the steps below before answering or sharing anything.'
            : 'Community risk signals, spam reports, and trust data — privacy-first, no raw numbers exposed.'}
        </p>
        <div className="flex flex-wrap gap-2 text-sm text-white/65">
          {summary.number_hash_preview ? <span className="rounded-full border border-white/15 bg-white/[0.04] px-3 py-1 font-mono text-white/80">Caller ···{summary.number_hash_preview}</span> : null}
          <span className="rounded-full border border-white/15 bg-white/[0.04] px-3 py-1">{relativeLastReported(summary.last_reported_at)}</span>
          {viewMode === 'recipient' ? (
            <Link href={url} className="rounded-full border border-cyan-300/20 bg-cyan-300/10 px-3 py-1 text-cyan-100">
              View detailed report
            </Link>
          ) : (
            <Link href={`${url}?viewMode=recipient`} className="rounded-full border border-cyan-300/20 bg-cyan-300/10 px-3 py-1 text-cyan-100">
              Open recipient mode
            </Link>
          )}
        </div>
      </div>

      <Card className={`border ${tone.border} ${tone.bg} p-5`}>
        <p className={`text-sm font-semibold ${tone.text}`}>{viewMode === 'recipient' ? recipientHeadline(summary.risk_label, hasData) : riskBannerText(summary)}</p>
      </Card>

      {viewMode === 'recipient' ? (
        <Card className="space-y-5 border border-white/10 bg-white/[0.03]">
          <div className="grid gap-3 md:grid-cols-2">
            <div className="rounded-2xl border border-white/10 bg-black/10 p-4">
              <h2 className="text-lg font-semibold text-white">What to do now</h2>
              <ol className="mt-3 space-y-2 text-sm text-white/75">
                {recipientSteps(summary.risk_label).map((step, index) => (
                  <li key={step} className="flex gap-2">
                    <span className="mt-0.5 inline-flex h-5 w-5 items-center justify-center rounded-full bg-cyan-200 text-xs font-semibold text-slate-950">{index + 1}</span>
                    <span>{step}</span>
                  </li>
                ))}
              </ol>
            </div>
            <div className="space-y-3">
              <div className="rounded-2xl border border-red-300/20 bg-red-300/10 p-4">
                <h3 className="text-sm font-semibold uppercase tracking-[0.14em] text-red-100">Do not share</h3>
                <p className="mt-2 text-sm text-red-50">{recipientDoNotShare().join(' · ')}</p>
              </div>
              <div className="rounded-2xl border border-emerald-300/20 bg-emerald-300/10 p-4">
                <h3 className="text-sm font-semibold uppercase tracking-[0.14em] text-emerald-100">Safe response</h3>
                <p className="mt-2 text-sm text-emerald-50">“{recipientSafeResponse(summary.risk_label)}”</p>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-cyan-300/20 bg-cyan-300/10 p-4">
            <h3 className="text-sm font-semibold uppercase tracking-[0.14em] text-cyan-100">Verify through official channels</h3>
            <ul className="mt-2 space-y-2 text-sm text-cyan-50">
              {recipientVerifyPath().map((item) => (
                <li key={item}>• {item}</li>
              ))}
            </ul>
          </div>

          {playbookSlug ? (
            <div className="rounded-2xl border border-violet-300/20 bg-violet-300/10 p-4">
              <p className="text-sm text-violet-100">Related scam playbook:</p>
              <Link href={`/scams/${playbookSlug}`} className="mt-2 inline-flex items-center gap-2 text-sm font-semibold text-white">
                Open guidance <ShieldCheck className="h-4 w-4" />
              </Link>
            </div>
          ) : null}

          <div className="rounded-2xl border border-white/10 bg-black/10 p-4">
            <p className="text-xs uppercase tracking-[0.14em] text-white/45">Share-ready copy</p>
            <p className="mt-2 whitespace-pre-wrap text-sm text-white/70">{reportShareCopy}</p>
          </div>
        </Card>
      ) : (
        <Card className="space-y-5 border border-white/10 bg-white/[0.03]">
          {hasData ? (
            <>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                <div className={`rounded-2xl border ${tone.border} ${tone.bg} p-4`}>
                  <p className="text-xs text-white/50">Reputation score</p>
                  <p className={`mt-1 text-3xl font-semibold ${tone.text}`}>{summary.reputation_score}</p>
                  <div className="mt-3 h-2 overflow-hidden rounded-full bg-white/10">
                    <div className={`h-full rounded-full ${tone.bar}`} style={{ width: `${Math.max(4, summary.reputation_score)}%` }} />
                  </div>
                </div>

                <div className="rounded-2xl border border-white/10 bg-black/10 p-4">
                  <p className="text-xs text-white/40">Risk label</p>
                  <p className={`mt-2 inline-flex rounded-full border px-3 py-1 text-sm font-semibold capitalize ${tone.border} ${tone.bg} ${tone.text}`}>{summary.risk_label.replace('_', ' ')}</p>
                </div>

                <div className="rounded-2xl border border-white/10 bg-black/10 p-4">
                  <p className="text-xs text-white/40">Total reports</p>
                  <p className={`mt-1 text-3xl font-semibold ${summary.total > 0 ? tone.text : 'text-white'}`}>{summary.total}</p>
                </div>

                <div className="rounded-2xl border border-white/10 bg-black/10 p-4">
                  <p className="text-xs text-white/40">Reports in 24h</p>
                  <p className="mt-1 text-3xl font-semibold text-white">{summary.recent_reports_24h}</p>
                </div>

                <div className="rounded-2xl border border-white/10 bg-black/10 p-4">
                  <p className="text-xs text-white/40">Top category</p>
                  <p className="mt-1 text-xl font-semibold capitalize text-white">{summary.top_category ?? 'n/a'}</p>
                </div>

                {summary.verified_report_count > 0 ? (
                  <div className="rounded-2xl border border-white/10 bg-black/10 p-4">
                    <p className="text-xs text-white/40">Verified reports</p>
                    <p className="mt-1 text-3xl font-semibold text-white">{summary.verified_report_count}</p>
                  </div>
                ) : null}
              </div>

              <div className="flex flex-wrap gap-2">
                {summary.country_code ? <span className="rounded-full border border-cyan-300/20 bg-cyan-300/10 px-3 py-1 text-sm text-cyan-100"><Globe2 className="mr-1 inline h-3.5 w-3.5" /> {summary.country_code}</span> : null}
              </div>

              {summary.activity_7d.some((point) => point.count > 0) ? (
                <div className="rounded-2xl border border-white/10 bg-black/10 p-4">
                  <p className="mb-3 flex items-center gap-2 text-sm font-medium text-white"><Activity className="h-4 w-4 text-violet-200" /> Activity — last 7 days</p>
                  <div className="flex h-28 items-end gap-2">
                    {summary.activity_7d.map((point) => (
                      <div key={point.day} className="flex flex-1 flex-col items-center gap-2">
                        <div className={`w-full rounded-t-lg ${tone.barSoft}`} style={{ height: `${Math.max(8, (point.count / maxActivity) * 90)}px` }} />
                        <span className="text-[10px] text-white/35">{new Date(point.day).toLocaleDateString('en-US', { weekday: 'short' }).slice(0, 1)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ) : null}
            </>
          ) : (
            <div className="py-10 text-center"><ShieldCheck className="mx-auto h-10 w-10 text-violet-200" /><h2 className="mt-4 text-2xl font-semibold text-white">No community reputation found yet.</h2><p className="mt-2 text-sm text-white/50">Analyze and report suspicious activity to help this reputation page grow.</p></div>
          )}
        </Card>
      )}

      {viewMode === 'owner' ? (
        <>
          <Card className={`space-y-4 border ${tone.border} ${tone.bg}`}>
            <h2 className={`text-xl font-semibold ${tone.text}`}>{action.icon} {action.title}</h2>
            <ul className="space-y-2 text-sm text-white/80">
              {action.tips.map((tip) => <li key={tip}>• {tip}</li>)}
            </ul>
            <p className="text-xs text-white/55">FilterCalls Response Guidance · decision-support only, not legal advice</p>
          </Card>

          <Card className="space-y-4 border border-white/10 bg-white/[0.03]">
            <h2 className="text-xl font-semibold text-white">Category breakdown</h2>
            {nonZeroCategories.length ? nonZeroCategories.map(([category, count]) => (
              <div key={category} className="space-y-2">
                <div className="flex justify-between text-sm"><span className="capitalize text-white/70">{category}</span><span className="text-white/40">{count}</span></div>
                <div className="h-2 overflow-hidden rounded-full bg-white/10"><div className={`h-full rounded-full ${tone.bar}`} style={{ width: `${(count / maxCategoryCount) * 100}%` }} /></div>
              </div>
            )) : <p className="text-sm text-white/50">No category breakdown available yet.</p>}
          </Card>

          {severityRows.length ? (
            <Card className="space-y-4 border border-white/10 bg-white/[0.03]">
              <h2 className="text-xl font-semibold text-white">Severity breakdown</h2>
              {severityRows.map((row) => {
                const barTone = row.level === 'critical'
                  ? 'bg-red-400'
                  : row.level === 'high'
                    ? 'bg-orange-400'
                    : row.level === 'medium'
                      ? 'bg-amber-400'
                      : 'bg-emerald-400';
                return (
                  <div key={row.level} className="space-y-2">
                    <div className="flex justify-between text-sm"><span className="capitalize text-white/70">{row.level}</span><span className="text-white/40">{row.count}</span></div>
                    <div className="h-2 overflow-hidden rounded-full bg-white/10"><div className={`h-full rounded-full ${barTone}`} style={{ width: `${(row.count / maxSeverityCount) * 100}%` }} /></div>
                  </div>
                );
              })}
            </Card>
          ) : null}
        </>
      ) : null}

      <Card className="space-y-3 border border-emerald-400/20 bg-emerald-400/[0.04]">
        <h2 className="text-xl font-semibold text-white">🔒 Privacy-first Intelligence</h2>
        <p className="text-sm text-white/60">Community reputation data uses SHA-256 hashed phone numbers only. Raw phone numbers are not displayed publicly. Reporter identities are never exposed. Reports are aggregated to protect user privacy.</p>
      </Card>

      <Card className="space-y-4 border border-white/10 bg-white/[0.03]">
        <h2 className="text-xl font-semibold text-white">Share this public report</h2>
        <ShareActions url={url} />
      </Card>

      <div className="flex flex-col gap-3 sm:flex-row">
        <Link href="/analysis" className="inline-flex justify-center rounded-xl bg-violet-600 px-5 py-3 text-sm font-medium text-white">{!hasData ? 'Analyze this number →' : summary.risk_label === 'high_risk' || summary.risk_label === 'suspicious' ? 'Analyze this caller →' : 'Analyze another number →'}</Link>
        <Link href={!hasData || summary.risk_label === 'high_risk' || summary.risk_label === 'suspicious' ? '/analysis' : '/insights'} className="inline-flex justify-center rounded-xl border border-white/10 bg-white/[0.05] px-5 py-3 text-sm font-medium text-white/80">
          {!hasData ? 'Report activity →' : summary.risk_label === 'high_risk' || summary.risk_label === 'suspicious' ? 'Report suspicious activity →' : 'View global insights →'}
        </Link>
      </div>

      <Card className="space-y-3 border border-white/10 bg-white/[0.03]">
        <h2 className="text-xl font-semibold text-white">Explore more caller intelligence</h2>
        <div className="grid gap-2 text-sm sm:grid-cols-2">
          <Link href="/insights" className="rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2 text-white/80 hover:text-white">View global insights</Link>
          <Link href="/analysis" className="rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2 text-white/80 hover:text-white">Analyze a new number</Link>
          <Link href="/" className="rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2 text-white/80 hover:text-white">Learn about FilterCalls</Link>
          <Link href="/pricing" className="rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2 text-white/80 hover:text-white">Pricing</Link>
        </div>
      </Card>
    </section>
  );
}
