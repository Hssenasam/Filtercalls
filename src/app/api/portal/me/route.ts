import { NextRequest, NextResponse } from 'next/server';
import { getD1 } from '@/lib/db/d1';
import { findUserByEmail, getSessionUser, hashPassword, requireCsrf, validatePasswordPolicy, verifyPassword } from '@/lib/auth/portal';

export const runtime = 'edge';

const unauthorized = () => NextResponse.json({ error: { code: 'UNAUTHORIZED', message: 'Authentication required' } }, { status: 401 });

export async function GET(request: NextRequest) {
  const db = getD1();
  if (!db) return NextResponse.json({ error: { code: 'DB_UNAVAILABLE', message: 'Database unavailable' } }, { status: 503 });
  const user = await getSessionUser(db, request);
  if (!user) return unauthorized();
  return NextResponse.json({ id: user.id, email: user.email, email_verified_at: user.email_verified_at });
}

export async function PATCH(request: NextRequest) {
  const db = getD1();
  if (!db) return NextResponse.json({ error: { code: 'DB_UNAVAILABLE', message: 'Database unavailable' } }, { status: 503 });
  if (!(await requireCsrf(request))) return NextResponse.json({ error: { code: 'FORBIDDEN', message: 'Invalid CSRF token' } }, { status: 403 });
  const user = await getSessionUser(db, request);
  if (!user) return unauthorized();

  const body = (await request.json()) as { email?: string; currentPassword?: string; newPassword?: string };
  if (body.email) {
    const existing = await findUserByEmail(db, body.email);
    if (existing && existing.id !== user.id) return NextResponse.json({ error: { code: 'EMAIL_IN_USE', message: 'Email already in use' } }, { status: 409 });
    await db.prepare('UPDATE users SET email = ?, updated_at = ? WHERE id = ?').bind(body.email.trim().toLowerCase(), Math.floor(Date.now() / 1000), user.id).run();
  }

  if (body.newPassword) {
    if (!body.currentPassword || !(await verifyPassword(body.currentPassword, user.password_hash))) {
      return NextResponse.json({ error: { code: 'UNAUTHORIZED', message: 'Current password is invalid' } }, { status: 401 });
    }
    const passwordError = validatePasswordPolicy(body.newPassword);
    if (passwordError) return NextResponse.json({ error: { code: 'WEAK_PASSWORD', message: passwordError } }, { status: 400 });
    await db.prepare('UPDATE users SET password_hash = ?, updated_at = ? WHERE id = ?').bind(await hashPassword(body.newPassword), Math.floor(Date.now() / 1000), user.id).run();
  }

  const refreshed = await db.prepare('SELECT id, email, email_verified_at FROM users WHERE id = ?').bind(user.id).first<{ id: string; email: string; email_verified_at: number | null }>();
  return NextResponse.json(refreshed);
}

export async function DELETE(request: NextRequest) {
  const db = getD1();
  if (!db) return NextResponse.json({ error: { code: 'DB_UNAVAILABLE', message: 'Database unavailable' } }, { status: 503 });
  if (!(await requireCsrf(request))) return NextResponse.json({ error: { code: 'FORBIDDEN', message: 'Invalid CSRF token' } }, { status: 403 });
  const user = await getSessionUser(db, request);
  if (!user) return unauthorized();

  const now = Math.floor(Date.now() / 1000);
  await db.prepare('UPDATE users SET disabled_at = ?, updated_at = ? WHERE id = ?').bind(now, now, user.id).run();
  await db.prepare('UPDATE api_keys SET revoked_at = ? WHERE user_id = ? AND revoked_at IS NULL').bind(Date.now(), user.id).run();
  await db.prepare('UPDATE webhooks SET disabled_at = ? WHERE user_id = ? AND disabled_at IS NULL').bind(Date.now(), user.id).run();
  await db.prepare('DELETE FROM sessions WHERE user_id = ?').bind(user.id).run();

  return NextResponse.json({ ok: true });
}
