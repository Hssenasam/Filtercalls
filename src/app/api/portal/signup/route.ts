import { NextRequest, NextResponse } from 'next/server.js';
import { getD1 } from '@/lib/db/d1';
import { createSession, hashPassword, maskEmail, setSessionCookies, validatePasswordPolicy } from '@/lib/auth/portal';
import { enforceWindowRateLimit } from '@/lib/auth/portal-rate-limit';

export const runtime = 'edge';

export async function POST(request: NextRequest) {
  const db = getD1();
  if (!db) return NextResponse.json({ error: { code: 'DB_UNAVAILABLE', message: 'Database unavailable' } }, { status: 503 });
  const clientIp = request.headers.get('cf-connecting-ip') ?? 'unknown';
  const limit = await enforceWindowRateLimit(`signup:${clientIp}`, 5, 3600);
  if (!limit.ok) return NextResponse.json({ error: { code: 'RATE_LIMITED', message: 'Try again later' } }, { status: 429 });

  const body = (await request.json()) as { email?: string; password?: string; confirmPassword?: string };
  const email = body.email?.trim().toLowerCase();
  const password = body.password ?? '';
  if (!email || !password) return NextResponse.json({ error: { code: 'INVALID_INPUT', message: 'Email and password are required' } }, { status: 400 });
  if (body.confirmPassword && body.confirmPassword !== password) return NextResponse.json({ error: { code: 'INVALID_INPUT', message: 'Passwords do not match' } }, { status: 400 });

  const policyError = validatePasswordPolicy(password);
  if (policyError) return NextResponse.json({ error: { code: 'WEAK_PASSWORD', message: policyError } }, { status: 400 });

  const exists = await db.prepare('SELECT id FROM users WHERE email = ? LIMIT 1').bind(email).first<{ id: string }>();
  if (exists) return NextResponse.json({ error: { code: 'EMAIL_IN_USE', message: 'Email already registered' } }, { status: 409 });

  const userId = crypto.randomUUID();
  const now = Math.floor(Date.now() / 1000);
  await db.prepare('INSERT INTO users (id, email, password_hash, created_at, updated_at) VALUES (?, ?, ?, ?, ?)').bind(userId, email, await hashPassword(password), now, now).run();

  const ip = request.headers.get('cf-connecting-ip') ?? request.headers.get('x-forwarded-for') ?? 'unknown';
  const userAgent = request.headers.get('user-agent');
  const session = await createSession(db, userId, ip, userAgent);

  console.info(`signup success: ${maskEmail(email)}`);

  const response = NextResponse.json({ id: userId, email, email_verified_at: null }, { status: 201 });
  await setSessionCookies(response, session.jwt, session.exp);
  return response;
}
