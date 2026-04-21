import { NextRequest, NextResponse } from 'next/server.js';
import { getD1 } from '@/lib/db/d1';
import { getSessionUser, requireCsrf } from '@/lib/auth/portal';

export const runtime = 'edge';

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const db = getD1();
  if (!db) return NextResponse.json({ error: { code: 'DB_UNAVAILABLE', message: 'Database unavailable' } }, { status: 503 });
  if (!(await requireCsrf(request))) return NextResponse.json({ error: { code: 'FORBIDDEN', message: 'Invalid CSRF token' } }, { status: 403 });
  const user = await getSessionUser(db, request);
  if (!user) return NextResponse.json({ error: { code: 'UNAUTHORIZED', message: 'Authentication required' } }, { status: 401 });

  const { id } = await params;
  const owned = await db.prepare('SELECT id FROM webhooks WHERE id = ? AND user_id = ? LIMIT 1').bind(id, user.id).first<{ id: string }>();
  if (!owned) return NextResponse.json({ error: { code: 'NOT_FOUND', message: 'Webhook not found' } }, { status: 404 });

  const body = (await request.json()) as { url?: string; secret?: string; event_types?: string[]; disabled?: boolean };
  await db.prepare('UPDATE webhooks SET url = COALESCE(?,url), secret = COALESCE(?,secret), event_types = COALESCE(?,event_types), disabled_at = ? WHERE id = ?').bind(body.url ?? null, body.secret ?? null, body.event_types ? body.event_types.join(',') : null, body.disabled ? Date.now() : null, id).run();
  return NextResponse.json({ ok: true });
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const db = getD1();
  if (!db) return NextResponse.json({ error: { code: 'DB_UNAVAILABLE', message: 'Database unavailable' } }, { status: 503 });
  if (!(await requireCsrf(request))) return NextResponse.json({ error: { code: 'FORBIDDEN', message: 'Invalid CSRF token' } }, { status: 403 });
  const user = await getSessionUser(db, request);
  if (!user) return NextResponse.json({ error: { code: 'UNAUTHORIZED', message: 'Authentication required' } }, { status: 401 });
  const { id } = await params;

  const result = await db.prepare('DELETE FROM webhooks WHERE id = ? AND user_id = ?').bind(id, user.id).run();
  return NextResponse.json({ ok: Boolean(result) });
}
