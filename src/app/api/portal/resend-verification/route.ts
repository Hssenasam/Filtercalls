import { NextRequest, NextResponse } from 'next/server.js';
import { getD1 } from '@/lib/db/d1';
import {
  createEmailVerification,
  ensurePortalAuthSchema,
  findUserByEmail,
  maskEmail,
  normalizeEmail
} from '@/lib/auth/portal';
import { enforceWindowRateLimit } from '@/lib/auth/portal-rate-limit';
import { canSendTransactionalEmail, sendVerificationEmail } from '@/lib/email/transactional';

export const runtime = 'edge';

export async function POST(request: NextRequest) {
  const db = getD1();
  if (!db) return NextResponse.json({ error: { code: 'DB_UNAVAILABLE', message: 'Database unavailable' } }, { status: 503 });
  await ensurePortalAuthSchema(db);

  const ip = request.headers.get('cf-connecting-ip') ?? 'unknown';
  const limit = await enforceWindowRateLimit(`resend-verification:${ip}`, 5, 3600);
  if (!limit.ok) {
    return NextResponse.json({ error: { code: 'RATE_LIMITED', message: 'Please wait a moment before requesting another verification email.' } }, { status: 429 });
  }

  const body = (await request.json().catch(() => null)) as { email?: string } | null;
  const email = normalizeEmail(body?.email ?? '');
  if (!email) {
    return NextResponse.json({ error: { code: 'INVALID_INPUT', message: 'Email is required.' } }, { status: 400 });
  }

  const user = await findUserByEmail(db, email);
  if (!user) {
    return NextResponse.json({ error: { code: 'NOT_FOUND', message: 'We could not find an account for that email.' } }, { status: 404 });
  }

  if (user.disabled_at) {
    return NextResponse.json({ error: { code: 'ACCOUNT_DISABLED', message: 'This account is disabled.' } }, { status: 403 });
  }

  if (user.email_verified_at) {
    return NextResponse.json({ error: { code: 'ALREADY_VERIFIED', message: 'This email is already verified. You can log in now.' } }, { status: 409 });
  }

  const verification = await createEmailVerification(db, user.id, user.email);

  if (canSendTransactionalEmail()) {
    console.info(`[email] verification resend started user=${user.id} email=${maskEmail(user.email)}`);
    const result = await sendVerificationEmail({
      to: user.email,
      verificationUrl: verification.verify_url,
      fullName: user.full_name ?? undefined
    });

    if (!result.ok) {
      console.error(
        `[email] verification resend failed user=${user.id} email=${maskEmail(user.email)} status=${result.providerStatus ?? 'n/a'} error=${result.error ?? 'unknown'}`
      );
      return NextResponse.json(
        {
          error: {
            code: 'VERIFICATION_EMAIL_FAILED',
            message: 'We could not resend the verification email right now. Please try again shortly.'
          }
        },
        { status: 502 }
      );
    }

    console.info(`[email] verification resend success user=${user.id} email=${maskEmail(user.email)} messageId=${result.id}`);
    return NextResponse.json({ ok: true, email: user.email, verification_email_sent: true }, { status: 200 });
  }

  console.warn(`[email] verification resend fallback link for ${maskEmail(user.email)}: ${verification.verify_url}`);
  return NextResponse.json(
    {
      ok: true,
      email: user.email,
      verification_email_sent: false,
      verify_url: verification.verify_url
    },
    { status: 200 }
  );
}
