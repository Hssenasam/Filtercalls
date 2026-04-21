import { NextRequest, NextResponse } from 'next/server.js';
import { getD1 } from '@/lib/db/d1';
import { createSession, findUserByEmail, genericAuthError, getRequestMeta, setSessionCookies, verifyPassword } from '@/lib/auth/portal';
import { enforceWindowRateLimit } from '@/lib/auth/portal-rate-limit';

export const runtime = 'edge';

export async function POST(request: NextRequest) {
  const db = getD1();
  if (!db) return NextResponse.json({ error: { code: 'DB_UNAVAILABLE', message: 'Database unavailable' } }, { status: 503 });

  const ip = request.headers.get('cf-connecting-ip') ?? 'unknown';
  const limit = await enforceWindowRateLimit(`login:${ip}`, 5, 15 * 60);
  if (!limit.ok) return NextResponse.json({ error: { code: 'RATE_LIMITED', message: 'Too many attempts' } }, { status: 429 });

  const body = (await request.json()) as { email?: string; password?: string };
  const user = body.email ? await findUserByEmail(db, body.email) : null;
  const ok = !!(user && body.password && (await verifyPassword(body.password, user.password_hash)));

  if (!ok) return NextResponse.json(genericAuthError, { status: 401 });

  const meta = await getRequestMeta();
  const session = await createSession(db, user.id, meta.ip, meta.userAgent);
  const response = NextResponse.json({ id: user.id, email: user.email, email_verified_at: user.email_verified_at }, { status: 200 });
  await setSessionCookies(response, session.jwt, session.exp);
  return response;
}
