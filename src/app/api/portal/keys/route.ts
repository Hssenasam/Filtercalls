import { NextRequest, NextResponse } from 'next/server';
import { createApiKeyRecord } from '@/lib/auth/api-key';
import { getD1 } from '@/lib/db/d1';
import { getSessionUser, requireCsrf } from '@/lib/auth/portal';
import { enforceWindowRateLimit } from '@/lib/auth/portal-rate-limit';

export const runtime = 'edge';

const unauthorized = () => NextResponse.json({ error: { code: 'UNAUTHORIZED', message: 'Authentication required' } }, { status: 401 });

export async function GET(request: NextRequest) {
  const db = getD1();
  if (!db) return NextResponse.json({ error: { code: 'DB_UNAVAILABLE', message: 'Database unavailable' } }, { status: 503 });
  const user = await getSessionUser(db, request);
  if (!user) return unauthorized();
  const limit = await enforceWindowRateLimit(`read:${user.id}`, 300, 60);
  if (!limit.ok) return NextResponse.json({ error: { code: 'RATE_LIMITED', message: 'Try again later' } }, { status: 429 });

  const rows = (await db.prepare('SELECT id, name, created_at, last_used_at, revoked_at, rate_limit_per_min FROM api_keys WHERE user_id = ? ORDER BY created_at DESC').bind(user.id).all()).results;
  return NextResponse.json({ results: rows });
}

export async function POST(request: NextRequest) {
  const db = getD1();
  if (!db) return NextResponse.json({ error: { code: 'DB_UNAVAILABLE', message: 'Database unavailable' } }, { status: 503 });
  if (!(await requireCsrf(request))) return NextResponse.json({ error: { code: 'FORBIDDEN', message: 'Invalid CSRF token' } }, { status: 403 });
  const user = await getSessionUser(db, request);
  if (!user) return unauthorized();

  const limit = await enforceWindowRateLimit(`mutate:${user.id}`, 60, 60);
  if (!limit.ok) return NextResponse.json({ error: { code: 'RATE_LIMITED', message: 'Try again later' } }, { status: 429 });

  const body = (await request.json()) as { name?: string; rate_limit_per_min?: number };
  const created = await createApiKeyRecord(db, { name: body.name, rateLimitPerMin: body.rate_limit_per_min });
  await db.prepare('UPDATE api_keys SET user_id = ? WHERE id = ?').bind(user.id, created.id).run();
  return NextResponse.json(created, { status: 201 });
}
