import { NextRequest, NextResponse } from 'next/server';
import { getD1 } from '@/lib/db/d1';
import { hashPassword, hashToken, validatePasswordPolicy } from '@/lib/auth/portal';

export const runtime = 'edge';

export async function POST(request: NextRequest) {
  const db = getD1();
  if (!db) return NextResponse.json({ error: { code: 'DB_UNAVAILABLE', message: 'Database unavailable' } }, { status: 503 });

  const body = (await request.json()) as { token?: string; password?: string };
  if (!body.token || !body.password) return NextResponse.json({ error: { code: 'INVALID_INPUT', message: 'Token and password are required' } }, { status: 400 });

  const passwordError = validatePasswordPolicy(body.password);
  if (passwordError) return NextResponse.json({ error: { code: 'WEAK_PASSWORD', message: passwordError } }, { status: 400 });

  const tokenHash = await hashToken(body.token);
  const record = await db.prepare('SELECT user_id, expires_at, used_at FROM password_resets WHERE token_hash = ?').bind(tokenHash).first<{ user_id: string; expires_at: number; used_at: number | null }>();
  const now = Math.floor(Date.now() / 1000);
  if (!record || record.used_at || record.expires_at < now) {
    return NextResponse.json({ error: { code: 'INVALID_TOKEN', message: 'Token is invalid or expired' } }, { status: 400 });
  }

  await db.prepare('UPDATE users SET password_hash = ?, updated_at = ? WHERE id = ?').bind(await hashPassword(body.password), now, record.user_id).run();
  await db.prepare('UPDATE password_resets SET used_at = ? WHERE token_hash = ?').bind(now, tokenHash).run();
  await db.prepare('DELETE FROM sessions WHERE user_id = ?').bind(record.user_id).run();

  return NextResponse.json({ ok: true });
}
