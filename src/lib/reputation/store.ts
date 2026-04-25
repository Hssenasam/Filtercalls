import type { D1DatabaseLike } from '@/lib/db/d1';
import { getCallingCode } from '@/lib/reputation/country-map';
import { sha256Hex } from '@/lib/reputation/hash';
import { summarizeReports, emptyReputationSummary } from '@/lib/reputation/scoring';
import { CommunityReportRow, ReportCategory, ReportSeverity } from '@/lib/reputation/types';

const ONE_HOUR = 60 * 60 * 1000;
const DAY = 24 * 60 * 60 * 1000;

export type InsertReportInput = {
  normalizedNumber: string;
  category: ReportCategory;
  severity: ReportSeverity;
  comment: string | null;
  sourceContext: string | null;
  reporterType: 'guest' | 'user';
  reporterUserId: string | null;
  reporterPlan: 'guest' | 'free' | 'pro' | 'user';
  ipHash: string;
  userAgentHash: string;
};

export const hashNumber = (normalizedNumber: string) => sha256Hex(normalizedNumber);

export const safeEmptySummary = (preview: string | null = null) => emptyReputationSummary(preview);

const mapReportRow = (row: Record<string, unknown>): CommunityReportRow => ({
  id: Number(row.id),
  number_hash: String(row.number_hash),
  calling_code: row.calling_code == null ? null : String(row.calling_code),
  category: String(row.category) as ReportCategory,
  severity: String(row.severity) as ReportSeverity,
  comment: row.comment == null ? null : String(row.comment),
  source_context: row.source_context == null ? null : String(row.source_context),
  reporter_type: String(row.reporter_type) === 'user' ? 'user' : 'guest',
  reporter_user_id: row.reporter_user_id == null ? null : String(row.reporter_user_id),
  reporter_plan: row.reporter_plan == null ? null : (String(row.reporter_plan) as CommunityReportRow['reporter_plan']),
  ip_hash: row.ip_hash == null ? null : String(row.ip_hash),
  user_agent_hash: row.user_agent_hash == null ? null : String(row.user_agent_hash),
  created_at: Number(row.created_at)
});

export const getReportsByHash = async (db: D1DatabaseLike, numberHash: string) => {
  const result = await db
    .prepare('SELECT * FROM community_reports WHERE number_hash = ? ORDER BY created_at DESC LIMIT 500')
    .bind(numberHash)
    .all<Record<string, unknown>>();
  return result.results.map(mapReportRow);
};

export const getReportsByHashPrefix = async (db: D1DatabaseLike, hashPrefix: string) => {
  const result = await db
    .prepare('SELECT * FROM community_reports WHERE number_hash LIKE ? ORDER BY created_at DESC LIMIT 500')
    .bind(`${hashPrefix}%`)
    .all<Record<string, unknown>>();
  return result.results.map(mapReportRow);
};

export const buildSummaryForNumber = async (db: D1DatabaseLike, normalizedNumber: string) => {
  const numberHash = await hashNumber(normalizedNumber);
  const rows = await getReportsByHash(db, numberHash);
  return summarizeReports(rows, numberHash.slice(0, 12));
};

export const buildSummaryForHashPrefix = async (db: D1DatabaseLike, hashPrefix: string) => {
  const rows = await getReportsByHashPrefix(db, hashPrefix);
  return summarizeReports(rows, hashPrefix.slice(0, 12));
};

export const ensureCanSubmitReport = async (db: D1DatabaseLike, input: InsertReportInput) => {
  const now = Date.now();
  const since = now - ONE_HOUR;
  const numberHash = await hashNumber(input.normalizedNumber);

  const duplicateByIp = await db
    .prepare('SELECT id FROM community_reports WHERE ip_hash = ? AND number_hash = ? AND category = ? AND created_at >= ? LIMIT 1')
    .bind(input.ipHash, numberHash, input.category, since)
    .first<{ id: number }>();

  if (duplicateByIp) return { ok: false as const, code: 'DUPLICATE_REPORT', status: 409, message: 'You already reported this behavior recently.' };

  if (input.reporterUserId) {
    const duplicateByUser = await db
      .prepare('SELECT id FROM community_reports WHERE reporter_user_id = ? AND number_hash = ? AND category = ? AND created_at >= ? LIMIT 1')
      .bind(input.reporterUserId, numberHash, input.category, since)
      .first<{ id: number }>();
    if (duplicateByUser) return { ok: false as const, code: 'DUPLICATE_REPORT', status: 409, message: 'You already reported this behavior recently.' };
  }

  const limitField = input.reporterUserId ? 'reporter_user_id' : 'ip_hash';
  const limitValue = input.reporterUserId ?? input.ipHash;
  const limit = input.reporterUserId ? 10 : 3;
  const countRow = await db
    .prepare(`SELECT COUNT(*) as count FROM community_reports WHERE ${limitField} = ? AND created_at >= ?`)
    .bind(limitValue, since)
    .first<{ count: number }>();

  if ((countRow?.count ?? 0) >= limit) return { ok: false as const, code: 'RATE_LIMITED', status: 429, message: 'Too many reports. Try again later.' };
  return { ok: true as const, numberHash };
};

export const insertCommunityReport = async (db: D1DatabaseLike, input: InsertReportInput) => {
  const allowed = await ensureCanSubmitReport(db, input);
  if (!allowed.ok) return allowed;

  await db
    .prepare('INSERT INTO community_reports (number_hash, calling_code, category, severity, comment, source_context, reporter_type, reporter_user_id, reporter_plan, ip_hash, user_agent_hash, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)')
    .bind(
      allowed.numberHash,
      getCallingCode(input.normalizedNumber),
      input.category,
      input.severity,
      input.comment,
      input.sourceContext,
      input.reporterType,
      input.reporterUserId,
      input.reporterPlan,
      input.ipHash,
      input.userAgentHash,
      Date.now()
    )
    .run();

  return { ok: true as const, numberHash: allowed.numberHash };
};

export const getPublicInsights = async (db: D1DatabaseLike) => {
  const since24h = Date.now() - DAY;
  const total = await db.prepare('SELECT COUNT(*) as count FROM community_reports').bind().first<{ count: number }>();
  const recent = await db.prepare('SELECT COUNT(*) as count FROM community_reports WHERE created_at >= ?').bind(since24h).first<{ count: number }>();
  const categories = await db.prepare('SELECT category, COUNT(*) as count FROM community_reports GROUP BY category ORDER BY count DESC LIMIT 10').bind().all<{ category: ReportCategory; count: number }>();
  const severities = await db.prepare('SELECT severity, COUNT(*) as count FROM community_reports GROUP BY severity ORDER BY count DESC').bind().all<{ severity: ReportSeverity; count: number }>();
  const countries = await db.prepare('SELECT calling_code, COUNT(*) as count FROM community_reports WHERE calling_code IS NOT NULL GROUP BY calling_code ORDER BY count DESC LIMIT 5').bind().all<{ calling_code: string; count: number }>();
  const highRisk = await db.prepare("SELECT COUNT(*) as count FROM community_reports WHERE created_at >= ? AND (category IN ('scam', 'suspicious') OR severity IN ('high', 'critical'))").bind(since24h).first<{ count: number }>();
  const critical = await db.prepare("SELECT COUNT(*) as count FROM community_reports WHERE created_at >= ? AND severity = 'critical'").bind(since24h).first<{ count: number }>();

  return { total, recent, categories, severities, countries, highRisk, critical };
};
