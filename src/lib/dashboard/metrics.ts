import type { D1DatabaseLike } from '../db/d1.ts';
import { getD1, maskE164 } from '../db/d1.ts';

export type DashboardMetrics = {
  windows: Array<{ label: string; total: number; highRiskPct: number; averageRisk: number }>;
  topCountries: Array<{ country: string; count: number }>;
  recent: Array<{ id: string; masked_number: string; country: string; risk_score: number; risk_level: string; created_at: number }>;
};

const WINDOW_CONFIG = [
  { label: 'last_24h', ms: 24 * 60 * 60 * 1000 },
  { label: 'last_7d', ms: 7 * 24 * 60 * 60 * 1000 },
  { label: 'last_30d', ms: 30 * 24 * 60 * 60 * 1000 }
];

const withDb = (db?: D1DatabaseLike) => db ?? getD1();

const scopedWhere = (userId?: string) => (userId ? ' WHERE user_id = ?' : '');
const scopedAndWindow = (userId?: string) => (userId ? ' WHERE user_id = ? AND created_at >= ?' : ' WHERE created_at >= ?');

export const loadDashboardMetrics = async (dbArg?: D1DatabaseLike, userId?: string): Promise<DashboardMetrics> => {
  const db = withDb(dbArg);
  if (!db) {
    return { windows: WINDOW_CONFIG.map((x) => ({ label: x.label, total: 0, highRiskPct: 0, averageRisk: 0 })), topCountries: [], recent: [] };
  }

  const now = Date.now();
  const windows = await Promise.all(
    WINDOW_CONFIG.map(async (window) => {
      const query = `SELECT COUNT(*) as total, AVG(risk_score) as avg_risk, SUM(CASE WHEN risk_score >= 60 THEN 1 ELSE 0 END) as high_count FROM analyses${scopedAndWindow(userId)}`;
      const row = userId
        ? await db.prepare(query).bind(userId, now - window.ms).first<{ total: number; avg_risk: number | null; high_count: number | null }>()
        : await db.prepare(query).bind(now - window.ms).first<{ total: number; avg_risk: number | null; high_count: number | null }>();

      const total = Number(row?.total ?? 0);
      const high = Number(row?.high_count ?? 0);
      return {
        label: window.label,
        total,
        highRiskPct: total > 0 ? Math.round((high / total) * 100) : 0,
        averageRisk: Math.round(Number(row?.avg_risk ?? 0))
      };
    })
  );

  const topQuery = `SELECT COALESCE(country, "Unknown") as country, COUNT(*) as count FROM analyses${scopedWhere(userId)} GROUP BY COALESCE(country, "Unknown") ORDER BY count DESC LIMIT 5`;
  const topCountries = (userId ? await db.prepare(topQuery).bind(userId).all<{ country: string; count: number }>() : await db.prepare(topQuery).bind().all<{ country: string; count: number }>()).results;

  const recentQuery = `SELECT id, e164, COALESCE(country, "Unknown") as country, COALESCE(risk_score, 0) as risk_score, COALESCE(risk_level, "unknown") as risk_level, created_at FROM analyses${scopedWhere(userId)} ORDER BY created_at DESC LIMIT 20`;
  const recentRows = (userId
    ? await db.prepare(recentQuery).bind(userId).all<{ id: string; e164: string; country: string; risk_score: number; risk_level: string; created_at: number }>()
    : await db.prepare(recentQuery).bind().all<{ id: string; e164: string; country: string; risk_score: number; risk_level: string; created_at: number }>()).results;

  return {
    windows,
    topCountries,
    recent: recentRows.map((row) => ({ ...row, masked_number: maskE164(row.e164) }))
  };
};
