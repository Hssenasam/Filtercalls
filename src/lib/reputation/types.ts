export const REPORT_CATEGORIES = ['scam', 'spam', 'robocall', 'telemarketing', 'suspicious', 'safe', 'business', 'delivery', 'recruiter', 'unknown'] as const;
export const REPORT_SEVERITIES = ['low', 'medium', 'high', 'critical'] as const;

export type ReportCategory = (typeof REPORT_CATEGORIES)[number];
export type ReportSeverity = (typeof REPORT_SEVERITIES)[number];
export type RiskLabel = 'clean' | 'watch' | 'suspicious' | 'high_risk';

export type CommunityReportRow = {
  id: number;
  number_hash: string;
  calling_code: string | null;
  category: ReportCategory;
  severity: ReportSeverity;
  comment: string | null;
  source_context: string | null;
  reporter_type: 'guest' | 'user';
  reporter_user_id: string | null;
  reporter_plan: 'guest' | 'free' | 'pro' | 'user' | null;
  ip_hash: string | null;
  user_agent_hash: string | null;
  created_at: number;
};

export type ActivityPoint = { day: string; count: number };

export type ReputationSummary = {
  has_community_data: boolean;
  total: number;
  reputation_score: number;
  risk_label: RiskLabel;
  top_category: ReportCategory | null;
  breakdown: Record<ReportCategory, number>;
  severity: Record<ReportSeverity, number>;
  recent_reports_24h: number;
  activity_7d: ActivityPoint[];
  last_reported_at: number | null;
  confidence: number;
  verified_report_count: number;
  country_code: string | null;
  number_hash_preview: string | null;
};

export type PublicInsights = {
  total_reports: number;
  recent_activity_24h: number;
  top_categories: Array<{ category: ReportCategory; count: number }>;
  severity_mix: Array<{ severity: ReportSeverity; count: number }>;
  risk_trend: { high_risk_reports_24h: number; critical_reports_24h: number };
  top_countries: Array<{ country_code: string; count: number }>;
};
