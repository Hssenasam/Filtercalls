import { NextRequest, NextResponse } from 'next/server';
import { getD1 } from '@/lib/db/d1';
import { getSessionUser, requireCsrf } from '@/lib/auth/portal';

export const runtime = 'edge';

export async function GET(request: NextRequest) {
  const db = getD1();
  if (!db) return NextResponse.json({ error: { code: 'DB_UNAVAILABLE', message: 'Database unavailable' } }, { status: 503 });
  const user = await getSessionUser(db, request);
  if (!user) return NextResponse.json({ error: { code: 'UNAUTHORIZED', message: 'Authentication required' } }, { status: 401 });

  const rows = (await db.prepare('SELECT id, url, event_types, created_at, disabled_at FROM webhooks WHERE user_id = ? ORDER BY created_at DESC').bind(user.id).all()).results;
  return NextResponse.json({ results: rows });
}

export async function POST(request: NextRequest) {
  const db = getD1();
  if (!db) return NextResponse.json({ error: { code: 'DB_UNAVAILABLE', message: 'Database unavailable' } }, { status: 503 });
  if (!(await requireCsrf(request))) return NextResponse.json({ error: { code: 'FORBIDDEN', message: 'Invalid CSRF token' } }, { status: 403 });
  const user = await getSessionUser(db, request);
  if (!user) return NextResponse.json({ error: { code: 'UNAUTHORIZED', message: 'Authentication required' } }, { status: 401 });

  const body = (await request.json()) as { url?: string; secret?: string; event_types?: string[] };
  if (!body.url) return NextResponse.json({ error: { code: 'INVALID_INPUT', message: 'url is required' } }, { status: 400 });
  const id = crypto.randomUUID();
  const now = Date.now();
  await db.prepare('INSERT INTO webhooks (id, api_key_id, url, secret, event_types, created_at, user_id) VALUES (?, NULL, ?, ?, ?, ?, ?)').bind(id, body.url, body.secret ?? null, body.event_types?.join(',') ?? 'analysis.completed,analysis.high_risk', now, user.id).run();
  return NextResponse.json({ id, url: body.url, created_at: now }, { status: 201 });
}
