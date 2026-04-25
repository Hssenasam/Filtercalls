import { NextResponse } from 'next/server.js';
import { getD1 } from '@/lib/db/d1';
import { getCountryForCallingCode } from '@/lib/reputation/country-map';
import { getPublicInsights } from '@/lib/reputation/store';
import type { PublicInsights, ReportCategory, ReportSeverity } from '@/lib/reputation/types';

export const runtime = 'edge';

const empty: PublicInsights = {
  total_reports: 0,
  recent_activity_24h: 0,
  top_categories: [],
  severity_mix: [],
  risk_trend: { high_risk_reports_24h: 0, critical_reports_24h: 0 },
  top_countries: []
};

export async function GET() {
  const db = getD1();
  if (!db) return NextResponse.json(empty, { headers: { 'Cache-Control': 'public, max-age=120' } });

  try {
    const data = await getPublicInsights(db);
    const payload: PublicInsights = {
      total_reports: data.total?.count ?? 0,
      recent_activity_24h: data.recent?.count ?? 0,
      top_categories: data.categories.results.map((row) => ({ category: row.category as ReportCategory, count: Number(row.count) })),
      severity_mix: data.severities.results.map((row) => ({ severity: row.severity as ReportSeverity, count: Number(row.count) })),
      risk_trend: { high_risk_reports_24h: data.highRisk?.count ?? 0, critical_reports_24h: data.critical?.count ?? 0 },
      top_countries: data.countries.results
        .map((row) => ({ country_code: getCountryForCallingCode(row.calling_code)?.iso ?? row.calling_code, count: Number(row.count) }))
        .filter((row) => !!row.country_code)
    };
    return NextResponse.json(payload, { headers: { 'Cache-Control': 'public, max-age=120' } });
  } catch {
    return NextResponse.json(empty, { headers: { 'Cache-Control': 'public, max-age=120' } });
  }
}
