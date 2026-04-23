import { NextRequest, NextResponse } from 'next/server.js';
import { getD1 } from '@/lib/db/d1';
import {
  createEmailVerification,
  ensurePortalAuthSchema,
  findUserByEmail,
  findUserByPhone,
  hashPassword,
  maskEmail,
  normalizeEmail,
  normalizePhone,
  validatePasswordPolicy
} from '@/lib/auth/portal';
import { enforceWindowRateLimit } from '@/lib/auth/portal-rate-limit';

export const runtime = 'edge';

export async function POST(request: NextRequest) {
  let step = 'start';
  try {
    const db = getD1();
    if (!db) return NextResponse.json({ error: { code: 'DB_UNAVAILABLE', message: 'Database unavailable' } }, { status: 503 });
    await ensurePortalAuthSchema(db);

    const clientIp = request.headers.get('cf-connecting-ip') ?? 'unknown';
    step = 'rate_limit';
    const limit = await enforceWindowRateLimit(`signup:${clientIp}`, 5, 3600);
    if (!limit.ok) return NextResponse.json({ error: { code: 'RATE_LIMITED', message: 'Try again later' } }, { status: 429 });

    step = 'parse_body';
    const body = (await request.json()) as {
      fullName?: string;
      email?: string;
      confirmEmail?: string;
      phone?: string;
      password?: string;
      confirmPassword?: string;
    };

    const fullName = body.fullName?.trim() ?? '';
    const email = normalizeEmail(body.email ?? '');
    const confirmEmail = normalizeEmail(body.confirmEmail ?? '');
    const phone = body.phone?.trim() ?? '';
    const phoneNormalized = phone ? normalizePhone(phone) : null;
    const password = body.password ?? '';

    if (!fullName) return NextResponse.json({ error: { code: 'INVALID_INPUT', message: 'Full name is required' } }, { status: 400 });
    if (!email || !password) return NextResponse.json({ error: { code: 'INVALID_INPUT', message: 'Email and password are required' } }, { status: 400 });
    if (confirmEmail && confirmEmail !== email) return NextResponse.json({ error: { code: 'INVALID_INPUT', message: 'Emails do not match' } }, { status: 400 });
    if (body.confirmPassword && body.confirmPassword !== password) return NextResponse.json({ error: { code: 'INVALID_INPUT', message: 'Passwords do not match' } }, { status: 400 });
    if (phone && !phoneNormalized) return NextResponse.json({ error: { code: 'INVALID_INPUT', message: 'Please enter a valid phone number' } }, { status: 400 });

    const policyError = validatePasswordPolicy(password);
    if (policyError) return NextResponse.json({ error: { code: 'WEAK_PASSWORD', message: policyError } }, { status: 400 });

    step = 'check_existing_email';
    const existingByEmail = await findUserByEmail(db, email);
    if (existingByEmail) return NextResponse.json({ error: { code: 'EMAIL_IN_USE', message: 'Email already registered' } }, { status: 409 });

    if (phoneNormalized) {
      step = 'check_existing_phone';
      const existingByPhone = await findUserByPhone(db, phoneNormalized);
      if (existingByPhone) return NextResponse.json({ error: { code: 'PHONE_IN_USE', message: 'Phone number already registered' } }, { status: 409 });
    }

    const userId = crypto.randomUUID();
    const now = Math.floor(Date.now() / 1000);
    step = 'hash_password';
    const passwordHash = await hashPassword(password);

    step = 'insert_user';
    await db
      .prepare(
        'INSERT INTO users (id, email, password_hash, email_verified_at, created_at, updated_at, full_name, phone, phone_normalized, auth_provider, google_sub, last_login_at) VALUES (?, ?, ?, NULL, ?, ?, ?, ?, ?, ?, NULL, NULL)'
      )
      .bind(userId, email, passwordHash, now, now, fullName, phone || null, phoneNormalized, 'password')
      .run();

    step = 'verification';
    const verification = await createEmailVerification(db, userId, email);

    if (process.env.RESEND_API_KEY) {
      console.info(`email verification queued for ${maskEmail(email)}`);
    } else {
      console.info(`email verification link for ${maskEmail(email)}: ${verification.verify_url}`);
    }

    return NextResponse.json(
      {
        id: userId,
        email,
        email_verified_at: null,
        verification_required: true,
        verify_url: verification.verify_url,
        next_step: 'verify_email'
      },
      { status: 201 }
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : 'unknown';
    console.error(`signup failure at step=${step}: ${message}`);
    return NextResponse.json({ error: { code: 'SIGNUP_FAILED', message: 'Unable to create account right now. Please retry shortly.' } }, { status: 500 });
  }
}
