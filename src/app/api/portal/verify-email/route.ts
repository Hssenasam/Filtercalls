import { NextRequest, NextResponse } from 'next/server.js';
import { getD1 } from '@/lib/db/d1';
import { hashToken } from '@/lib/auth/portal';

export const runtime = 'edge';

export async function GET(request: NextRequest) {
  const token = request.nextUrl.searchParams.get('token');
  const db = getD1();
  if (!db || !token) return NextResponse.json({ error: { code: 'INVALID_INPUT', message: 'Missing token' } }, { status: 400 });

  const tokenHash = await hashToken(token);
  const row = await db.prepare('SELECT user_id, expires_at FROM password_resets WHERE token_hash = ?').bind(tokenHash).first<{ user_id: string; expires_at: number }>();
  if (!row || row.expires_at < Math.floor(Date.now() / 1000)) return NextResponse.json({ error: { code: 'INVALID_TOKEN', message: 'Invalid token' } }, { status: 400 });
  await db.prepare('UPDATE users SET email_verified_at = ? WHERE id = ?').bind(Math.floor(Date.now() / 1000), row.user_id).run();
  return NextResponse.json({ ok: true });
}
