import { getCountryForCallingCode } from '@/lib/reputation/country-map';
import { REPORT_CATEGORIES, REPORT_SEVERITIES, CommunityReportRow, ReportCategory, ReputationSummary, RiskLabel } from '@/lib/reputation/types';

const CATEGORY_WEIGHTS: Record<ReportCategory, number> = {
  scam: 24,
  suspicious: 16,
  robocall: 13,
  spam: 10,
  telemarketing: 8,
  unknown: 5,
  safe: -12,
  business: -8,
  delivery: -6,
  recruiter: -5
};

const SEVERITY_MULTIPLIERS = { low: 0.7, medium: 1, high: 1.35, critical: 1.75 } as const;
const DAY_MS = 24 * 60 * 60 * 1000;

const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value));
const dateKey = (timestamp: number) => new Date(timestamp).toISOString().slice(0, 10);

const riskLabelForScore = (score: number): RiskLabel => {
  if (score >= 70) return 'high_risk';
  if (score >= 45) return 'suspicious';
  if (score >= 20) return 'watch';
  return 'clean';
};

const emptyActivity = () => {
  const today = new Date();
  return Array.from({ length: 7 }, (_, index) => {
    const date = new Date(today.getTime() - (6 - index) * DAY_MS);
    return { day: date.toISOString().slice(0, 10), count: 0 };
  });
};

export const emptyReputationSummary = (numberHashPreview: string | null = null): ReputationSummary => ({
  has_community_data: false,
  total: 0,
  reputation_score: 0,
  risk_label: 'clean',
  top_category: null,
  breakdown: Object.fromEntries(REPORT_CATEGORIES.map((category) => [category, 0])) as ReputationSummary['breakdown'],
  severity: Object.fromEntries(REPORT_SEVERITIES.map((severity) => [severity, 0])) as ReputationSummary['severity'],
  recent_reports_24h: 0,
  activity_7d: emptyActivity(),
  last_reported_at: null,
  confidence: 0,
  verified_report_count: 0,
  country_code: null,
  number_hash_preview: numberHashPreview
});

export const summarizeReports = (rows: CommunityReportRow[], numberHashPreview: string | null): ReputationSummary => {
  if (!rows.length) return emptyReputationSummary(numberHashPreview);

  const now = Date.now();
  const summary = emptyReputationSummary(numberHashPreview);
  summary.has_community_data = true;
  summary.total = rows.length;

  let weighted = 0;
  let latest = 0;
  const activity = new Map(summary.activity_7d.map((point) => [point.day, point.count]));

  for (const row of rows) {
    summary.breakdown[row.category] += 1;
    summary.severity[row.severity] += 1;
    latest = Math.max(latest, row.created_at);
    if (now - row.created_at <= DAY_MS) summary.recent_reports_24h += 1;
    if (row.reporter_plan === 'pro') summary.verified_report_count += 1;

    const day = dateKey(row.created_at);
    if (activity.has(day)) activity.set(day, (activity.get(day) ?? 0) + 1);

    const base = CATEGORY_WEIGHTS[row.category] * SEVERITY_MULTIPLIERS[row.severity];
    const proBoost = row.reporter_plan === 'pro' ? 1.5 : 1; // Pro reporter weight boost
    const recencyBoost = now - row.created_at <= DAY_MS ? 1.1 : 1;
    weighted += base * proBoost * recencyBoost;
  }

  const maxCategory = REPORT_CATEGORIES.reduce<ReportCategory | null>((best, category) => {
    if (!best) return summary.breakdown[category] > 0 ? category : best;
    return summary.breakdown[category] > summary.breakdown[best] ? category : best;
  }, null);

  summary.top_category = maxCategory;
  summary.last_reported_at = latest || null;
  summary.activity_7d = summary.activity_7d.map((point) => ({ ...point, count: activity.get(point.day) ?? 0 }));
  summary.reputation_score = Math.round(clamp(weighted, 0, 100));
  summary.risk_label = riskLabelForScore(summary.reputation_score);
  summary.confidence = Math.round(clamp(rows.length * 18 + summary.recent_reports_24h * 6 + summary.verified_report_count * 10, 15, 100));

  const country = getCountryForCallingCode(rows.find((row) => row.calling_code)?.calling_code ?? null);
  summary.country_code = country?.iso ?? null;
  return summary;
};
