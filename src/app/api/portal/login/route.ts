import { NextRequest, NextResponse } from 'next/server.js';
import { getD1 } from '@/lib/db/d1';
import {
  createSession,
  ensurePortalAuthSchema,
  findUserByIdentifier,
  genericAuthError,
  setSessionCookies,
  touchLastLogin,
  verifyPassword
} from '@/lib/auth/portal';
import { enforceWindowRateLimit } from '@/lib/auth/portal-rate-limit';

export const runtime = 'edge';

export async function POST(request: NextRequest) {
  const db = getD1();
  if (!db) return NextResponse.json({ error: { code: 'DB_UNAVAILABLE', message: 'Database unavailable' } }, { status: 503 });
  await ensurePortalAuthSchema(db);

  const ip = request.headers.get('cf-connecting-ip') ?? 'unknown';
  const limit = await enforceWindowRateLimit(`login:${ip}`, 5, 15 * 60);
  if (!limit.ok) return NextResponse.json({ error: { code: 'RATE_LIMITED', message: 'Too many attempts' } }, { status: 429 });

  const body = (await request.json()) as { email?: string; identifier?: string; password?: string };
  const identifier = body.identifier?.trim() || body.email?.trim() || '';
  const user = identifier ? await findUserByIdentifier(db, identifier) : null;
  const ok = !!(user && body.password && user.password_hash && (await verifyPassword(body.password, user.password_hash)));

  if (!ok) return NextResponse.json(genericAuthError, { status: 401 });
  if (user.disabled_at) return NextResponse.json({ error: { code: 'ACCOUNT_DISABLED', message: 'This account is disabled' } }, { status: 403 });
  if (!user.email_verified_at) {
    return NextResponse.json(
      {
        error: {
          code: 'EMAIL_NOT_VERIFIED',
          message: 'Please verify your email before logging in.'
        }
      },
      { status: 403 }
    );
  }

  const ipAddress = request.headers.get('cf-connecting-ip') ?? request.headers.get('x-forwarded-for') ?? 'unknown';
  const userAgent = request.headers.get('user-agent');
  const session = await createSession(db, user.id, ipAddress, userAgent);
  await touchLastLogin(db, user.id);
  const response = NextResponse.json(
    {
      id: user.id,
      email: user.email,
      email_verified_at: user.email_verified_at,
      full_name: user.full_name,
      phone: user.phone
    },
    { status: 200 }
  );
  await setSessionCookies(response, session.jwt, session.exp);
  return response;
}
