import { NextRequest, NextResponse } from 'next/server.js';
import { getD1 } from '@/lib/db/d1';
import { getSessionUser } from '@/lib/auth/portal';

export const runtime = 'edge';

export async function GET(request: NextRequest) {
  const db = getD1();
  if (!db) return NextResponse.json({ error: { code: 'DB_UNAVAILABLE', message: 'Database unavailable' } }, { status: 503 });
  const user = await getSessionUser(db, request);
  if (!user) return NextResponse.json({ error: { code: 'UNAUTHORIZED', message: 'Authentication required' } }, { status: 401 });

  const since = Date.now() - 30 * 24 * 60 * 60 * 1000;
  const daily = (await db.prepare('SELECT strftime("%Y-%m-%d", created_at / 1000, "unixepoch") as day, COUNT(*) as analyses, SUM(CASE WHEN risk_score >= 60 THEN 1 ELSE 0 END) as high_risk FROM analyses WHERE user_id = ? AND created_at >= ? GROUP BY day ORDER BY day ASC').bind(user.id, since).all<{ day: string; analyses: number; high_risk: number }>()).results;
  const keys = (await db.prepare('SELECT api_keys.id, api_keys.name, COUNT(analyses.id) as analyses FROM api_keys LEFT JOIN analyses ON analyses.api_key_id = api_keys.id WHERE api_keys.user_id = ? GROUP BY api_keys.id ORDER BY analyses DESC').bind(user.id).all<{ id: string; name: string | null; analyses: number }>()).results;
  return NextResponse.json({ daily, keys });
}
