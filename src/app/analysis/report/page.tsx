'use client';

import Link from 'next/link';
import { Suspense, useEffect, useMemo, useState } from 'react';
import { ArrowLeft, Download, ShieldCheck } from 'lucide-react';
import { useSearchParams } from 'next/navigation';
import { Card } from '@/components/ui/card';
import { buildAICallDecision } from '@/lib/decision';
import type { AICallDecision, AICallDecisionInput, CallDecisionRiskTier } from '@/lib/decision';
import type { CallIntentAnalysis, NuisanceLevel } from '@/lib/engine/types';
import type { ReputationSummary, ReportCategory, ReportSeverity, RiskLabel } from '@/lib/reputation/types';
import { maskPhoneNumber, createReportId, formatReportDate } from '@/lib/report/mask';

const REPORT_TTL_MS = 30 * 60 * 1000;

type StoredReportPayload = {
  number: string;
  data: CallIntentAnalysis;
  createdAt: number;
};

type ReportErrorKey = 'missing_key' | 'missing_number' | 'missing_entry' | 'expired' | 'corrupted';

type PlanTier = 'free' | 'pro';

type FetchState = 'idle' | 'loading' | 'error';

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

const executiveSummaryByRisk: Record<RiskLabel, string> = {
  clean: 'This number shows low risk signals based on the available intelligence. Continue normal caution, especially if the caller requests sensitive information.',
  watch: 'This number shows some caution signals. The caller may be legitimate, but the available data suggests verifying the identity before responding.',
  suspicious: 'This number shows elevated risk signals. Avoid sharing sensitive information until the caller is independently verified.',
  high_risk: 'This number shows high-risk indicators. Treat this call with caution and avoid payments, credentials, or personal data requests.'
};

const DECISION_ACTION_LABELS: Record<AICallDecision['primaryAction'], string> = {
  block: 'BLOCK',
  send_to_voicemail: 'SEND TO VOICEMAIL',
  verify_first: 'VERIFY FIRST',
  answer_cautiously: 'ANSWER CAUTIOUSLY'
};

const DECISION_SCENARIO_LABELS: Record<AICallDecision['scenario'], string> = {
  possible_impersonation: 'Possible impersonation',
  possible_financial_scam: 'Possible financial pressure call',
  possible_delivery_or_service: 'Possible delivery or service call',
  possible_debt_collection: 'Possible debt collection call',
  possible_sales_or_telemarketing: 'Possible sales or telemarketing call',
  possible_robocall: 'Possible robocall',
  unknown_caller: 'Unknown caller identity',
  likely_safe: 'Likely safe caller'
};

const DECISION_TONE: Record<CallDecisionRiskTier, { badge: string; border: string; soft: string; text: string; bar: string }> = {
  critical: {
    badge: 'border-red-200 bg-red-50 text-red-800',
    border: 'border-red-200',
    soft: 'bg-red-50',
    text: 'text-red-800',
    bar: 'bg-red-600'
  },
  high: {
    badge: 'border-orange-200 bg-orange-50 text-orange-800',
    border: 'border-orange-200',
    soft: 'bg-orange-50',
    text: 'text-orange-800',
    bar: 'bg-orange-500'
  },
  medium: {
    badge: 'border-amber-200 bg-amber-50 text-amber-800',
    border: 'border-amber-200',
    soft: 'bg-amber-50',
    text: 'text-amber-800',
    bar: 'bg-amber-500'
  },
  low: {
    badge: 'border-emerald-200 bg-emerald-50 text-emerald-800',
    border: 'border-emerald-200',
    soft: 'bg-emerald-50',
    text: 'text-emerald-800',
    bar: 'bg-emerald-600'
  }
};

const nullableText = (value?: string | null) => (value && value.trim() ? value : 'Unknown');

const displayValidity = (value: boolean | undefined) => {
  if (value === true) return 'Yes';
  if (value === false) return 'No';
  return 'Unknown';
};

const toRiskLabel = (riskScore: number): RiskLabel => {
  if (riskScore >= 70) return 'high_risk';
  if (riskScore >= 45) return 'suspicious';
  if (riskScore >= 20) return 'watch';
  return 'clean';
};

const parseStoredPayload = (raw: string | null): StoredReportPayload | null => {
  if (!raw) return null;

  try {
    const parsed: unknown = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object') return null;

    const candidate = parsed as Partial<StoredReportPayload>;
    if (typeof candidate.number !== 'string' || typeof candidate.createdAt !== 'number') return null;
    if (!candidate.data || typeof candidate.data !== 'object') return null;

    const data = candidate.data as Partial<CallIntentAnalysis>;
    if (!data.formatted_number || typeof data.formatted_number !== 'string') return null;
    if (typeof data.risk_score !== 'number' || typeof data.trust_score !== 'number' || typeof data.confidence !== 'number') return null;
    if (!Array.isArray(data.signals)) return null;

    return { number: candidate.number, data: candidate.data as CallIntentAnalysis, createdAt: candidate.createdAt };
  } catch {
    return null;
  }
};

const loadReportPayload = (key: string, number: string): { payload?: StoredReportPayload; error?: ReportErrorKey } => {
  const cleanStorage = (storage: Storage, storageKey: string) => {
    storage.removeItem(storageKey);
  };

  const targets: Storage[] = [];
  if (typeof window !== 'undefined') {
    if (window.sessionStorage) targets.push(window.sessionStorage);
    if (window.localStorage) targets.push(window.localStorage);
  }

  for (const target of targets) {
    const raw = target.getItem(key);
    if (!raw) continue;

    const parsed = parseStoredPayload(raw);
    if (!parsed) {
      cleanStorage(target, key);
      return { error: 'corrupted' };
    }

    if (Date.now() - parsed.createdAt > REPORT_TTL_MS) {
      cleanStorage(target, key);
      return { error: 'expired' };
    }

    if (parsed.number !== number) {
      cleanStorage(target, key);
      return { error: 'corrupted' };
    }

    return { payload: parsed };
  }

  return { error: 'missing_entry' };
};

const inferExplanation = (riskLabel: RiskLabel): string => {
  switch (riskLabel) {
    case 'high_risk':
      return 'Multiple high-risk indicators suggest this caller should be treated as potentially unsafe.';
    case 'suspicious':
      return 'There are enough negative signals to justify independent verification before engaging.';
    case 'watch':
      return 'Some caution indicators exist, so verify identity before sharing sensitive details.';
    default:
      return 'Signals are generally low risk, but basic caller verification is still recommended.';
  }
};

const scoreTone = (kind: 'risk' | 'trust' | 'confidence' | 'nuisance', value: number | NuisanceLevel) => {
  const numeric = typeof value === 'number' ? value : value === 'critical' ? 92 : value === 'high' ? 75 : value === 'medium' ? 52 : 20;

  if (kind === 'risk' || kind === 'nuisance') {
    if (numeric >= 70) return 'bg-red-500';
    if (numeric >= 35) return 'bg-amber-500';
    return 'bg-emerald-500';
  }

  if (kind === 'trust') {
    if (numeric >= 70) return 'bg-emerald-500';
    if (numeric >= 40) return 'bg-amber-500';
    return 'bg-red-500';
  }

  if (numeric >= 75) return 'bg-blue-500';
  if (numeric >= 50) return 'bg-amber-500';
  return 'bg-red-400';
};

const nuisanceScore = (level: NuisanceLevel) => {
  switch (level) {
    case 'critical':
      return 90;
    case 'high':
      return 72;
    case 'medium':
      return 48;
    default:
      return 22;
  }
};

const buildDecisionInput = (result: CallIntentAnalysis, riskLabel: RiskLabel, communitySummary: ReputationSummary): AICallDecisionInput => ({
  riskScore: result.risk_score,
  trustScore: result.trust_score,
  nuisanceLevel: result.nuisance_level,
  lineType: result.line_type,
  countryCode: result.country ?? null,
  probableIntent: result.probable_intent,
  riskLabel,
  signals: result.signals.map((signal) => ({
    label: signal.label,
    impact: signal.impact,
    description: signal.detail
  })),
  community: {
    hasCommunityData: communitySummary.has_community_data,
    total: communitySummary.total,
    topCategory: communitySummary.top_category,
    riskLabel: communitySummary.risk_label,
    verifiedReportCount: communitySummary.verified_report_count,
    recentReports24h: communitySummary.recent_reports_24h,
    severity: communitySummary.severity
  }
});

const verificationPath = (decision: AICallDecision) => {
  if (decision.riskTier === 'critical') {
    return [
      'End the call immediately or do not answer.',
      'Do not call back this number directly.',
      'Contact the claimed organization using its official app, website, or published number.',
      'Report the call if it requested codes, payment, remote access, or identity details.'
    ];
  }

  if (decision.riskTier === 'high') {
    return [
      'Let the caller leave a voicemail with name, company, and reason.',
      'Verify the caller independently before returning the call.',
      'Do not provide sensitive information during any callback unless you initiated it through official channels.'
    ];
  }

  if (decision.riskTier === 'medium') {
    return [
      'Ask for the caller’s full name, organization, and reference number.',
      'Do not share verification codes, payment details, passwords, or personal identification.',
      'Pause and verify through an official channel before continuing.'
    ];
  }

  return [
    'Ask who is calling and what this is regarding.',
    'Continue normally if caller identity and purpose are clear.',
    'Avoid sharing sensitive information unless you initiated the contact.'
  ];
};

const AIDecisionPdfSection = ({
  decision,
  reportId,
  generatedAt,
  maskedNumber
}: {
  decision: AICallDecision;
  reportId: string;
  generatedAt: string;
  maskedNumber: string;
}) => {
  const tone = DECISION_TONE[decision.riskTier];
  const primaryReason = decision.reasons[0] ?? 'Decision-support guidance available.';
  const path = verificationPath(decision);

  return (
    <Card className={`print-card break-inside-avoid border ${tone.border} bg-white p-6 text-gray-900`}>
      <div className={`rounded-2xl border ${tone.border} ${tone.soft} p-4`}>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-gray-500">Call Safety Certificate</p>
            <h2 className="mt-2 text-xl font-semibold">AI Call Safety Coach</h2>
            <p className="mt-1 text-sm text-gray-700">Decision-support guidance based on risk, trust, verification, and community signals.</p>
          </div>
          <span className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold ${tone.badge}`}>{DECISION_ACTION_LABELS[decision.primaryAction]}</span>
        </div>

        <div className="mt-4 grid gap-3 text-xs text-gray-700 sm:grid-cols-2 lg:grid-cols-4">
          <div><span className="font-semibold text-gray-900">Report ID:</span> {reportId || 'Generating…'}</div>
          <div><span className="font-semibold text-gray-900">Generated:</span> {generatedAt || 'Generating…'}</div>
          <div><span className="font-semibold text-gray-900">Masked number:</span> {maskedNumber}</div>
          <div><span className="font-semibold text-gray-900">Watermark:</span> FilterCalls Safety Report</div>
        </div>
      </div>

      <div className="mt-5 grid gap-4 md:grid-cols-3">
        <div className="rounded-2xl border border-gray-200 bg-white p-4">
          <p className="text-xs uppercase tracking-[0.2em] text-gray-500">Primary action</p>
          <p className={`mt-2 text-2xl font-semibold ${tone.text}`}>{DECISION_ACTION_LABELS[decision.primaryAction]}</p>
          <p className="mt-2 text-sm text-gray-600">{primaryReason}</p>
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white p-4">
          <p className="text-xs uppercase tracking-[0.2em] text-gray-500">Risk tier</p>
          <p className="mt-2 text-2xl font-semibold capitalize text-gray-900">{decision.riskTier}</p>
          <p className="mt-2 text-sm text-gray-600">Scenario: {DECISION_SCENARIO_LABELS[decision.scenario]}</p>
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white p-4">
          <p className="text-xs uppercase tracking-[0.2em] text-gray-500">Decision confidence</p>
          <p className="mt-2 text-2xl font-semibold text-gray-900">{decision.confidence}%</p>
          <div className="mt-3 h-2 overflow-hidden rounded-full bg-gray-200">
            <div className={`h-full rounded-full ${tone.bar}`} style={{ width: `${Math.max(2, Math.min(100, decision.confidence))}%` }} />
          </div>
        </div>
      </div>

      <div className="mt-5 grid gap-4 lg:grid-cols-2">
        <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4">
          <p className="text-sm font-semibold text-gray-900">Why this decision</p>
          <ul className="mt-3 space-y-2">
            {decision.reasons.slice(0, 6).map((reason) => (
              <li key={reason} className="flex gap-2 text-sm text-gray-700"><span className={`mt-1 h-2 w-2 rounded-full ${tone.bar}`} /> <span>{reason}</span></li>
            ))}
          </ul>
        </div>

        <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4">
          <p className="text-sm font-semibold text-gray-900">Recommended response</p>
          <p className="mt-3 rounded-xl border border-gray-200 bg-white p-3 text-sm leading-6 text-gray-700">“{decision.recommendedResponse}”</p>
          <p className="mt-3 text-sm font-semibold text-gray-900">Safest next step</p>
          <p className="mt-1 text-sm leading-6 text-gray-700">{decision.safestNextStep}</p>
        </div>
      </div>

      <div className="mt-5 grid gap-4 lg:grid-cols-3">
        <div>
          <p className="text-sm font-semibold text-gray-900">Do not share</p>
          <div className="mt-3 flex flex-wrap gap-2">
            {decision.doNotShare.map((item) => (
              <span key={item} className="rounded-full border border-gray-300 bg-white px-3 py-1 text-xs font-medium text-gray-700">{item}</span>
            ))}
          </div>
        </div>

        <div>
          <p className="text-sm font-semibold text-gray-900">Red flags</p>
          <ul className="mt-3 space-y-2">
            {decision.redFlags.slice(0, 5).map((flag) => (
              <li key={flag} className="text-sm leading-5 text-gray-700">• {flag}</li>
            ))}
          </ul>
        </div>

        <div>
          <p className="text-sm font-semibold text-gray-900">Verification path</p>
          <ol className="mt-3 space-y-2">
            {path.map((step, index) => (
              <li key={step} className="flex gap-2 text-sm leading-5 text-gray-700"><span className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[11px] font-semibold text-white ${tone.bar}`}>{index + 1}</span><span>{step}</span></li>
            ))}
          </ol>
        </div>
      </div>

      <p className="mt-5 rounded-xl border border-gray-200 bg-white p-3 text-xs leading-5 text-gray-600">{decision.disclaimer}</p>
    </Card>
  );
};

const ErrorState = ({ title, message, cta }: { title: string; message: string; cta: string }) => (
  <div className="mx-auto max-w-xl py-16">
    <Card className="space-y-4 border border-gray-200 bg-white text-gray-900 print-card">
      <h1 className="text-2xl font-semibold">{title}</h1>
      <p className="text-sm text-gray-600">{message}</p>
      <Link href="/analysis" className="inline-flex items-center rounded-xl border border-gray-300 px-4 py-2 text-sm font-medium text-gray-900">
        {cta}
      </Link>
    </Card>
  </div>
);

const ScoreBar = ({ label, value, kind, note }: { label: string; value: number; kind: 'risk' | 'trust' | 'confidence' | 'nuisance'; note: string }) => (
  <div className="rounded-2xl border border-gray-200 bg-white p-4 text-gray-900 print-card">
    <div className="flex items-center justify-between gap-3">
      <p className="text-sm font-semibold">{label}</p>
      <span className="text-sm font-semibold">{Math.round(value)}</span>
    </div>
    <div className="mt-3 h-2 overflow-hidden rounded-full bg-gray-200">
      <div className={`h-full rounded-full ${scoreTone(kind, value)}`} style={{ width: `${Math.max(2, Math.min(100, value))}%` }} />
    </div>
    <p className="mt-2 text-xs text-gray-600">{note}</p>
  </div>
);

function AnalysisPdfReportPageContent() {
  const searchParams = useSearchParams();
  const key = searchParams.get('key')?.trim() ?? '';
  const number = searchParams.get('number')?.trim() ?? '';

  const [error, setError] = useState<ReportErrorKey | null>(null);
  const [reportData, setReportData] = useState<StoredReportPayload | null>(null);
  const [reportId, setReportId] = useState('');
  const [generatedAt, setGeneratedAt] = useState('');
  const [communitySummary, setCommunitySummary] = useState<ReputationSummary>(emptySummary);
  const [communityStatus, setCommunityStatus] = useState<FetchState>('idle');
  const [planTier, setPlanTier] = useState<PlanTier>('free');

  useEffect(() => {
    if (!key) {
      setError('missing_key');
      return;
    }

    if (!number) {
      setError('missing_number');
      return;
    }

    const loaded = loadReportPayload(key, number);
    if (loaded.error) {
      setError(loaded.error);
      return;
    }

    const payload = loaded.payload;
    if (!payload) {
      setError('missing_entry');
      return;
    }

    setReportData(payload);
    setGeneratedAt(formatReportDate(new Date(payload.createdAt)));
    void createReportId(`${number}${payload.createdAt.toString()}`).then(setReportId).catch(() => setReportId('unavailable'));
  }, [key, number]);

  useEffect(() => {
    if (!number) return;

    let mounted = true;
    setCommunityStatus('loading');
    void fetch(`/api/reports/summary?number=${encodeURIComponent(number)}`)
      .then(async (response) => {
        if (!response.ok) throw new Error('community-unavailable');
        return (await response.json()) as ReputationSummary;
      })
      .then((summary) => {
        if (!mounted) return;
        setCommunitySummary(summary);
        setCommunityStatus('idle');
      })
      .catch(() => {
        if (!mounted) return;
        setCommunityStatus('error');
      });

    return () => {
      mounted = false;
    };
  }, [number]);

  useEffect(() => {
    let mounted = true;

    void fetch('/api/portal/me', { credentials: 'include' })
      .then(async (response) => {
        if (!mounted || response.status === 401 || !response.ok) return;
        const payload = (await response.json()) as unknown;
        if (!payload || typeof payload !== 'object') return;

        const withPlan = payload as { plan?: { id?: string; label?: string } };
        const planId = withPlan.plan?.id?.toLowerCase() ?? '';
        const planLabel = withPlan.plan?.label?.toLowerCase() ?? '';
        if (planId.includes('pro') || planLabel.includes('pro')) {
          setPlanTier('pro');
        }
      })
      .catch(() => {
        // Keep default free watermark silently.
      });

    return () => {
      mounted = false;
    };
  }, []);

  const errorContent = useMemo(() => {
    if (!error) return null;

    if (error === 'missing_number') {
      return <ErrorState title="No number provided." message="Open a report from a completed phone analysis to generate a PDF." cta="Go to Analysis →" />;
    }

    if (error === 'expired') {
      return <ErrorState title="Report data expired." message="For privacy and accuracy, stored report data expires after 30 minutes." cta="Re-analyze →" />;
    }

    if (error === 'corrupted') {
      return <ErrorState title="Report data is corrupted." message="Please run the analysis again to generate a fresh report." cta="Re-analyze →" />;
    }

    return <ErrorState title="No report data found." message={error === 'missing_key' ? 'Open a report from a completed phone analysis to generate a PDF.' : 'The report data may have expired or the page was opened directly.'} cta={error === 'missing_key' ? 'Go to Analysis →' : 'Re-analyze →'} />;
  }, [error]);

  if (errorContent) {
    return <section className="print-page bg-gray-50 px-4 py-8 text-gray-900">{errorContent}</section>;
  }

  if (!reportData) {
    return (
      <section className="print-page bg-gray-50 px-4 py-8 text-gray-900">
        <div className="mx-auto max-w-5xl rounded-2xl border border-gray-200 bg-white p-6">
          <p className="text-sm text-gray-600">Preparing report…</p>
        </div>
      </section>
    );
  }

  const result = reportData.data;
  const resolvedRiskLabel = toRiskLabel(result.risk_score);
  const aiDecision = buildAICallDecision(buildDecisionInput(result, resolvedRiskLabel, communitySummary));
  const summary = executiveSummaryByRisk[resolvedRiskLabel] ?? 'This report summarizes available phone intelligence signals to support a safer decision.';
  const maskedInput = maskPhoneNumber(reportData.number);
  const maskedFormatted = maskPhoneNumber(result.formatted_number);
  const maxActivity = Math.max(1, ...communitySummary.activity_7d.map((entry) => entry.count));
  const breakdownEntries = Object.entries(communitySummary.breakdown).filter(([, count]) => count > 0) as [ReportCategory, number][];
  const severityEntries = Object.entries(communitySummary.severity).filter(([, count]) => count > 0) as [ReportSeverity, number][];

  return (
    <section className="print-page bg-gray-50 px-4 py-6 text-gray-900 md:px-6">
      <style jsx global>{`
        @media print {
          body {
            background: white !important;
          }

          .no-print {
            display: none !important;
          }

          .print-card {
            break-inside: avoid;
            page-break-inside: avoid;
            border: 1px solid #e5e7eb;
            margin-bottom: 1rem;
          }

          .print-page {
            background: white !important;
            color: #111827 !important;
          }
        }
      `}</style>

      <div className="no-print mx-auto mb-5 flex w-full max-w-6xl flex-wrap gap-3">
        <button type="button" onClick={() => window.print()} className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-medium text-white">
          <Download className="h-4 w-4" /> Save as PDF
        </button>
        <Link href="/analysis" className="inline-flex items-center gap-2 rounded-xl border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-900">
          <ArrowLeft className="h-4 w-4" /> Back to analysis
        </Link>
      </div>

      <article className="mx-auto w-full max-w-6xl space-y-4">
        <Card className="print-card space-y-4 border border-gray-200 bg-white p-6 text-gray-900">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-gray-500">FilterCalls</p>
              <h1 className="mt-2 text-3xl font-semibold">Phone Intelligence Report</h1>
              <p className="mt-1 text-sm text-gray-600">Risk, trust, verification & community reputation</p>
            </div>
            <div className="space-y-2 text-right text-xs text-gray-600">
              <p><span className="font-semibold text-gray-900">Report ID:</span> {reportId || 'Generating…'}</p>
              <p><span className="font-semibold text-gray-900">Generated:</span> {generatedAt}</p>
              <span className="inline-flex rounded-full border border-gray-300 bg-gray-100 px-3 py-1 text-xs font-medium text-gray-800">
                {result.data_source === 'apilayer_number_verification' ? 'APILayer Verified' : 'Internal Engine'}
              </span>
            </div>
          </div>
        </Card>

        <Card className="print-card border border-gray-200 bg-white p-6 text-gray-900">
          <h2 className="text-lg font-semibold">Executive Summary</h2>
          <p className="mt-2 text-sm leading-6 text-gray-700">{summary}</p>
        </Card>

        <Card className="print-card border border-gray-200 bg-white p-6 text-gray-900">
          <h2 className="text-lg font-semibold">Number Summary</h2>
          <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <div><p className="text-xs text-gray-500">Masked number</p><p className="text-base font-semibold">{maskedInput}</p></div>
            <div><p className="text-xs text-gray-500">Country / Region</p><p className="text-sm font-medium">{nullableText(result.country)} / {nullableText(result.region)}</p></div>
            <div><p className="text-xs text-gray-500">Carrier</p><p className="text-sm font-medium">{nullableText(result.carrier)}</p></div>
            <div><p className="text-xs text-gray-500">Line type</p><p className="text-sm font-medium capitalize">{nullableText(result.line_type)}</p></div>
            <div><p className="text-xs text-gray-500">Formatted number</p><p className="text-sm font-medium">{maskedFormatted}</p></div>
            <div><p className="text-xs text-gray-500">Valid</p><p className="text-sm font-medium">{displayValidity(result.is_valid)}</p></div>
          </div>
        </Card>

        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
          <ScoreBar label="Risk Score" value={result.risk_score} kind="risk" note="Higher score means greater risk." />
          <ScoreBar label="Trust Score" value={result.trust_score} kind="trust" note="Higher score means stronger trust signals." />
          <ScoreBar label="Confidence" value={Math.max(0, Math.min(100, result.confidence))} kind="confidence" note="Confidence in this recommendation." />
          <ScoreBar label="Nuisance Level" value={nuisanceScore(result.nuisance_level)} kind="nuisance" note="Estimated call disruption severity." />
        </div>

        <AIDecisionPdfSection decision={aiDecision} reportId={reportId} generatedAt={generatedAt} maskedNumber={maskedInput} />

        <Card className="print-card border border-gray-200 bg-white p-6 text-gray-900">
          <h2 className="text-lg font-semibold">Recommended Action</h2>
          <div className="mt-3 grid gap-3 md:grid-cols-3">
            <div><p className="text-xs text-gray-500">Recommended action</p><p className="text-sm font-semibold">{result.recommended_action}</p></div>
            <div><p className="text-xs text-gray-500">Probable intent</p><p className="text-sm font-semibold">{result.probable_intent}</p></div>
            <div className="md:col-span-3"><p className="text-xs text-gray-500">Reasoning</p><p className="text-sm text-gray-700">{result.explanation?.trim() || inferExplanation(resolvedRiskLabel)}</p></div>
          </div>
        </Card>

        <Card className="print-card border border-gray-200 bg-white p-6 text-gray-900">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-lg font-semibold">Verification Intelligence</h2>
            <span className="inline-flex items-center gap-1 rounded-full border border-gray-300 bg-gray-100 px-3 py-1 text-xs font-medium text-gray-800">
              <ShieldCheck className="h-3.5 w-3.5" /> {result.verification.status === 'verified' ? 'APILayer verified' : 'Internal engine only'}
            </span>
          </div>
          <p className="mt-2 text-sm text-gray-600">{result.verification.confidence_note}</p>
          <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <div><p className="text-xs text-gray-500">Carrier</p><p className="text-sm font-medium">{nullableText(result.carrier)}</p></div>
            <div><p className="text-xs text-gray-500">Line type</p><p className="text-sm font-medium capitalize">{nullableText(result.line_type)}</p></div>
            <div><p className="text-xs text-gray-500">Region</p><p className="text-sm font-medium">{nullableText(result.region)}</p></div>
            <div><p className="text-xs text-gray-500">Country</p><p className="text-sm font-medium">{nullableText(result.country)}</p></div>
            <div><p className="text-xs text-gray-500">Formatted number</p><p className="text-sm font-medium">{maskedFormatted}</p></div>
            <div><p className="text-xs text-gray-500">Validity</p><p className="text-sm font-medium">{displayValidity(result.is_valid)}</p></div>
          </div>
        </Card>

        <Card className="print-card border border-gray-200 bg-white p-6 text-gray-900">
          <h2 className="text-lg font-semibold">Community Reputation</h2>
          {communityStatus === 'error' ? (
            <p className="mt-3 text-sm text-gray-600">Community data unavailable.</p>
          ) : !communitySummary.has_community_data ? (
            <p className="mt-3 text-sm text-gray-600">No community reports yet.</p>
          ) : (
            <div className="mt-4 space-y-4">
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                <div><p className="text-xs text-gray-500">Total reports</p><p className="text-lg font-semibold">{communitySummary.total}</p></div>
                <div><p className="text-xs text-gray-500">Reputation score</p><p className="text-lg font-semibold">{communitySummary.reputation_score}</p></div>
                <div><p className="text-xs text-gray-500">Risk label</p><p className="text-lg font-semibold capitalize">{communitySummary.risk_label.replace('_', ' ')}</p></div>
                <div><p className="text-xs text-gray-500">Top category</p><p className="text-sm font-medium capitalize">{communitySummary.top_category ?? 'Unknown'}</p></div>
                <div><p className="text-xs text-gray-500">Reports in last 24h</p><p className="text-sm font-medium">{communitySummary.recent_reports_24h}</p></div>
                {communitySummary.verified_report_count > 0 ? <div><p className="text-xs text-gray-500">Verified reports</p><p className="text-sm font-medium">{communitySummary.verified_report_count}</p></div> : null}
              </div>

              <div>
                <p className="mb-2 text-sm font-medium">7-day activity</p>
                <div className="flex items-end gap-2">
                  {communitySummary.activity_7d.map((point) => (
                    <div key={point.day} className="flex flex-1 flex-col items-center gap-1">
                      <div className="w-full rounded-t bg-slate-800" style={{ height: `${Math.max(6, (point.count / maxActivity) * 56)}px` }} />
                      <span className="text-[10px] text-gray-500">{new Date(point.day).toLocaleDateString('en-US', { weekday: 'short' }).slice(0, 1)}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <p className="text-sm font-medium">Breakdown</p>
                <div className="flex flex-wrap gap-2">
                  {breakdownEntries.map(([category, count]) => (
                    <span key={category} className="rounded-full border border-gray-300 bg-gray-100 px-3 py-1 text-xs font-medium text-gray-700">{category}: {count}</span>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <p className="text-sm font-medium">Severity</p>
                <div className="flex flex-wrap gap-2">
                  {severityEntries.map(([severity, count]) => (
                    <span key={severity} className="rounded-full border border-gray-300 bg-gray-100 px-3 py-1 text-xs font-medium text-gray-700">{severity}: {count}</span>
                  ))}
                </div>
              </div>
            </div>
          )}
        </Card>

        <Card className="print-card border border-gray-200 bg-white p-6 text-gray-900">
          <h2 className="text-lg font-semibold">Signal Breakdown</h2>
          {result.signals.length === 0 ? (
            <p className="mt-3 text-sm text-gray-600">No detailed signal breakdown is available for this report.</p>
          ) : (
            <div className="mt-3 grid gap-3 md:grid-cols-2">
              {result.signals.map((signal) => (
                <div key={signal.id} className="rounded-xl border border-gray-200 bg-white p-3">
                  <div className="flex items-start justify-between gap-3">
                    <p className="text-sm font-medium text-gray-900">{signal.label}</p>
                    <span className="rounded-full border border-gray-300 px-2 py-0.5 text-[11px] uppercase tracking-wide text-gray-700">{signal.impact}</span>
                  </div>
                  <p className="mt-2 text-sm text-gray-600">{signal.detail}</p>
                </div>
              ))}
            </div>
          )}
        </Card>

        <Card className="print-card border border-gray-200 bg-gray-50 p-5 text-gray-900">
          <p className="text-sm font-semibold">🔒 Privacy-first report</p>
          <p className="mt-1 text-sm text-gray-700">Community reputation data uses SHA-256 hashed phone numbers only. Raw numbers and reporter identities are never stored or exposed in public reputation data.</p>
        </Card>

        <footer className="print-card rounded-2xl border border-gray-200 bg-white p-5 text-sm text-gray-700">
          <p className="font-semibold text-gray-900">FilterCalls · filtercalls.com</p>
          <p className="mt-1">{planTier === 'pro' ? 'FilterCalls Professional Report' : 'FilterCalls Free Report · Upgrade for API access, bulk analysis, and higher limits.'}</p>
          <p className="mt-1">Report ID: {reportId || 'Generating…'} · {generatedAt}</p>
          <p className="mt-2 text-xs text-gray-600">This report is informational and should be used as a decision-support tool only.</p>
        </footer>
      </article>
    </section>
  );
}


export default function AnalysisPdfReportPage() {
  return (
    <Suspense fallback={<section className="print-page bg-gray-50 px-4 py-8 text-gray-900"><div className="mx-auto max-w-5xl rounded-2xl border border-gray-200 bg-white p-6"><p className="text-sm text-gray-600">Preparing report…</p></div></section>}>
      <AnalysisPdfReportPageContent />
    </Suspense>
  );
}
