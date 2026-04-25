'use client';

import { FormEvent, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { BarChart3, CheckCircle2, LoaderCircle, Share2, ShieldAlert } from 'lucide-react';
import { Card } from '@/components/ui/card';
import type { ReputationSummary, ReportCategory, ReportSeverity } from '@/lib/reputation/types';

const quickReports: Array<{ category: ReportCategory; label: string; severity: ReportSeverity }> = [
  { category: 'scam', label: '🚨 Scam', severity: 'medium' },
  { category: 'spam', label: '📢 Spam', severity: 'medium' },
  { category: 'robocall', label: '🤖 Robocall', severity: 'medium' },
  { category: 'safe', label: '✅ Safe', severity: 'low' }
];

const categories: ReportCategory[] = ['scam', 'spam', 'robocall', 'telemarketing', 'suspicious', 'safe', 'business', 'delivery', 'recruiter', 'unknown'];
const severities: ReportSeverity[] = ['low', 'medium', 'high', 'critical'];
const contexts = ['missed call', 'SMS', 'WhatsApp', 'business call', 'delivery', 'recruiter', 'other'];

const emptySummary: ReputationSummary = {
  has_community_data: false,
  total: 0,
  reputation_score: 0,
  risk_label: 'clean',
  top_category: null,
  breakdown: Object.fromEntries(categories.map((category) => [category, 0])) as ReputationSummary['breakdown'],
  severity: Object.fromEntries(severities.map((severity) => [severity, 0])) as ReputationSummary['severity'],
  recent_reports_24h: 0,
  activity_7d: [],
  last_reported_at: null,
  confidence: 0,
  verified_report_count: 0,
  country_code: null,
  number_hash_preview: null
};

const riskTone: Record<ReputationSummary['risk_label'], string> = {
  clean: 'border-emerald-400/25 bg-emerald-400/10 text-emerald-200',
  watch: 'border-amber-400/25 bg-amber-400/10 text-amber-200',
  suspicious: 'border-orange-400/25 bg-orange-400/10 text-orange-200',
  high_risk: 'border-red-400/25 bg-red-400/10 text-red-200'
};

export function CommunityReputation({ number }: { number: string }) {
  const [summary, setSummary] = useState<ReputationSummary>(emptySummary);
  const [loading, setLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const fetchSummary = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/reports/summary?number=${encodeURIComponent(number)}`, { cache: 'no-store' });
      setSummary(response.ok ? ((await response.json()) as ReputationSummary) : emptySummary);
    } catch {
      setSummary(emptySummary);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void fetchSummary();
  }, [number]);

  const shareUrl = useMemo(() => {
    if (!summary.number_hash_preview || typeof window === 'undefined') return null;
    return `${window.location.origin}/report/${summary.number_hash_preview}`;
  }, [summary.number_hash_preview]);

  const submitReport = async (category: ReportCategory, severity: ReportSeverity, extra?: { source_context?: string; comment?: string }) => {
    setSubmitting(true);
    setMessage(null);
    try {
      const response = await fetch('/api/reports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ number, category, severity, quick: !extra, ...extra })
      });
      const payload = await response.json().catch(() => null);
      if (!response.ok) throw new Error(payload?.error?.message ?? 'Unable to submit report.');
      setMessage('Thanks for improving caller intelligence.');
      setFormOpen(false);
      await fetchSummary();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Unable to submit report.');
    } finally {
      setSubmitting(false);
    }
  };

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    await submitReport(data.get('category') as ReportCategory, data.get('severity') as ReportSeverity, {
      source_context: String(data.get('source_context') ?? ''),
      comment: String(data.get('comment') ?? '')
    });
  };

  const copyShare = async () => {
    if (!shareUrl) return;
    await navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1500);
  };

  const maxActivity = Math.max(1, ...summary.activity_7d.map((point) => point.count));
  const nonZeroBreakdown = categories.filter((category) => summary.breakdown[category] > 0);

  return (
    <Card className="space-y-4 border border-white/10 bg-white/[0.03]">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="flex items-center gap-2 text-sm font-medium text-white"><ShieldAlert className="h-4 w-4 text-violet-200" /> Community Reputation</p>
          <p className="mt-1 text-sm text-white/45">Privacy-first caller reputation based on aggregated community reports.</p>
        </div>
        {summary.has_community_data ? <span className={`w-fit rounded-full border px-3 py-1 text-xs font-medium ${riskTone[summary.risk_label]}`}>{summary.risk_label.replace('_', ' ')}</span> : null}
      </div>

      {loading ? (
        <div className="space-y-3">
          <div className="h-5 w-48 animate-pulse rounded bg-white/10" />
          <div className="grid gap-3 sm:grid-cols-3">{[0, 1, 2].map((item) => <div key={item} className="h-16 animate-pulse rounded-2xl bg-white/10" />)}</div>
        </div>
      ) : summary.has_community_data ? (
        <div className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-4">
            <div className="rounded-2xl border border-white/10 bg-black/10 p-3"><p className="text-xs text-white/40">Reputation score</p><p className="mt-1 text-2xl font-semibold text-white">{summary.reputation_score}</p></div>
            <div className="rounded-2xl border border-white/10 bg-black/10 p-3"><p className="text-xs text-white/40">Reports</p><p className="mt-1 text-2xl font-semibold text-white">{summary.total}</p></div>
            <div className="rounded-2xl border border-white/10 bg-black/10 p-3"><p className="text-xs text-white/40">Verified</p><p className="mt-1 text-2xl font-semibold text-white">{summary.verified_report_count}</p></div>
            <div className="rounded-2xl border border-white/10 bg-black/10 p-3"><p className="text-xs text-white/40">24h activity</p><p className="mt-1 text-2xl font-semibold text-white">{summary.recent_reports_24h}</p></div>
          </div>

          {summary.activity_7d.some((point) => point.count > 0) ? (
            <div className="rounded-2xl border border-white/10 bg-black/10 p-4">
              <p className="mb-3 flex items-center gap-2 text-xs font-medium uppercase tracking-[0.18em] text-white/40"><BarChart3 className="h-4 w-4" /> Activity — last 7 days</p>
              <div className="flex h-24 items-end gap-2">
                {summary.activity_7d.map((point) => (
                  <div key={point.day} className="flex flex-1 flex-col items-center gap-2">
                    <div className="w-full rounded-t-lg bg-violet-400/60" style={{ height: `${Math.max(8, (point.count / maxActivity) * 80)}px` }} />
                    <span className="text-[10px] text-white/35">{new Date(point.day).toLocaleDateString('en-US', { weekday: 'short' }).slice(0, 1)}</span>
                  </div>
                ))}
              </div>
            </div>
          ) : null}

          <div className="flex flex-wrap gap-2">
            {summary.top_category ? <span className="rounded-full border border-violet-300/20 bg-violet-300/10 px-3 py-1 text-xs text-violet-100">Top: {summary.top_category}</span> : null}
            {summary.country_code ? <span className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-xs text-white/60">Country: {summary.country_code}</span> : null}
            {nonZeroBreakdown.map((category) => <span key={category} className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-xs text-white/60">{category}: {summary.breakdown[category]}</span>)}
          </div>

          {shareUrl ? <button type="button" onClick={copyShare} className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.05] px-3 py-2 text-sm text-white/80 hover:bg-white/[0.08]"><Share2 className="h-4 w-4" /> {copied ? 'Link copied!' : 'Share Caller Report'}</button> : null}
        </div>
      ) : (
        <div className="rounded-2xl border border-white/10 bg-black/10 p-4">
          <p className="text-sm font-medium text-white">No community reports yet.</p>
          <p className="mt-1 text-sm text-white/45">Be the first to report what happened and improve caller intelligence.</p>
        </div>
      )}

      <div className="flex flex-wrap gap-2">
        {quickReports.map((item) => <button key={item.category} type="button" disabled={submitting} onClick={() => void submitReport(item.category, item.severity)} className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5 text-xs text-white/75 hover:bg-white/[0.08] disabled:opacity-50">{item.label}</button>)}
        <button type="button" onClick={() => setFormOpen((value) => !value)} className="rounded-full border border-violet-300/20 bg-violet-300/10 px-3 py-1.5 text-xs text-violet-100">⋯ More options</button>
      </div>

      {formOpen ? (
        <form onSubmit={onSubmit} className="grid gap-3 rounded-2xl border border-white/10 bg-black/10 p-4 sm:grid-cols-2">
          <select name="category" className="rounded-xl border border-white/10 bg-slate-950 px-3 py-2 text-sm text-white">{categories.map((category) => <option key={category} value={category}>{category}</option>)}</select>
          <select name="severity" className="rounded-xl border border-white/10 bg-slate-950 px-3 py-2 text-sm text-white">{severities.map((severity) => <option key={severity} value={severity}>{severity}</option>)}</select>
          <select name="source_context" className="rounded-xl border border-white/10 bg-slate-950 px-3 py-2 text-sm text-white sm:col-span-2">{contexts.map((context) => <option key={context} value={context}>{context}</option>)}</select>
          <textarea name="comment" maxLength={280} placeholder="Optional comment" className="min-h-24 rounded-xl border border-white/10 bg-slate-950 px-3 py-2 text-sm text-white sm:col-span-2" />
          <button type="submit" disabled={submitting} className="inline-flex items-center justify-center gap-2 rounded-xl bg-violet-600 px-4 py-2 text-sm font-medium text-white sm:col-span-2">{submitting ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />} Submit report</button>
        </form>
      ) : null}

      {message ? <p className="text-sm text-emerald-300">{message}</p> : null}
    </Card>
  );
}

export { quickReports };
