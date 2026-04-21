import { NextRequest, NextResponse } from 'next/server.js';
import { getD1 } from '@/lib/db/d1';
import { getSessionUser, requireCsrf } from '@/lib/auth/portal';

export const runtime = 'edge';

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const db = getD1();
  if (!db) return NextResponse.json({ error: { code: 'DB_UNAVAILABLE', message: 'Database unavailable' } }, { status: 503 });
  if (!(await requireCsrf(request))) return NextResponse.json({ error: { code: 'FORBIDDEN', message: 'Invalid CSRF token' } }, { status: 403 });
  const user = await getSessionUser(db, request);
  if (!user) return NextResponse.json({ error: { code: 'UNAUTHORIZED', message: 'Authentication required' } }, { status: 401 });

  const { id } = await params;
  const owned = await db.prepare('SELECT id FROM api_keys WHERE id = ? AND user_id = ? LIMIT 1').bind(id, user.id).first<{ id: string }>();
  if (!owned) return NextResponse.json({ error: { code: 'NOT_FOUND', message: 'Key not found' } }, { status: 404 });

  await db.prepare('UPDATE api_keys SET revoked_at = ? WHERE id = ?').bind(Date.now(), id).run();
  return NextResponse.json({ ok: true });
}
