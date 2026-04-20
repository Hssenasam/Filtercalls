import { NextRequest, NextResponse } from 'next/server';
import { getD1 } from '@/lib/db/d1';
import { enforceWindowRateLimit } from '@/lib/auth/portal-rate-limit';
import { findUserByEmail, getPortalBaseUrl, hashToken, maskEmail } from '@/lib/auth/portal';

export const runtime = 'edge';

export async function POST(request: NextRequest) {
  const db = getD1();
  if (!db) return NextResponse.json({ error: { code: 'DB_UNAVAILABLE', message: 'Database unavailable' } }, { status: 503 });

  const ip = request.headers.get('cf-connecting-ip') ?? 'unknown';
  const limit = await enforceWindowRateLimit(`forgot:${ip}`, 3, 3600);
  if (!limit.ok) return NextResponse.json({ error: { code: 'RATE_LIMITED', message: 'Try again later' } }, { status: 429 });

  const body = (await request.json()) as { email?: string };
  const email = body.email?.trim().toLowerCase();
  if (!email) return NextResponse.json({ ok: true });

  const user = await findUserByEmail(db, email);
  if (user) {
    const token = crypto.randomUUID().replace(/-/g, '') + crypto.randomUUID().replace(/-/g, '');
    const tokenHash = await hashToken(token);
    const expires = Math.floor(Date.now() / 1000) + 3600;
    await db.prepare('INSERT OR REPLACE INTO password_resets (token_hash, user_id, expires_at, used_at) VALUES (?, ?, ?, NULL)').bind(tokenHash, user.id, expires).run();

    const link = `${getPortalBaseUrl()}/reset-password?token=${token}`;
    if (process.env.RESEND_API_KEY) {
      // TODO(phase-5): integrate templated emails.
      console.info(`password reset queued for ${maskEmail(user.email)}`);
    } else {
      console.info(`password reset link for ${maskEmail(user.email)}: ${link}`);
    }
  }

  return NextResponse.json({ ok: true });
}
