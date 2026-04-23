import { NextRequest, NextResponse } from 'next/server.js';
import {
  clearGoogleOauthState,
  createSession,
  ensurePortalAuthSchema,
  findUserByEmail,
  findUserByGoogleSub,
  getGoogleClientId,
  getGoogleClientSecret,
  getGoogleRedirectUri,
  normalizeEmail,
  readGoogleOauthState,
  setSessionCookies,
  touchLastLogin
} from '@/lib/auth/portal';
import { getD1 } from '@/lib/db/d1';

export const runtime = 'edge';

type GoogleTokenResponse = {
  access_token?: string;
  error?: string;
};

type GoogleUserInfo = {
  sub?: string;
  email?: string;
  email_verified?: boolean;
  name?: string;
};

const redirectWithError = (request: NextRequest, code: string) =>
  NextResponse.redirect(new URL(`/login?error=${encodeURIComponent(code)}`, request.url));

export async function GET(request: NextRequest) {
  const db = getD1();
  if (!db) return redirectWithError(request, 'db_unavailable');
  await ensurePortalAuthSchema(db);

  const clientId = getGoogleClientId();
  const clientSecret = getGoogleClientSecret();
  if (!clientId || !clientSecret) return redirectWithError(request, 'google_not_configured');

  const code = request.nextUrl.searchParams.get('code');
  const state = request.nextUrl.searchParams.get('state');
  const cookieState = readGoogleOauthState(request);
  if (!code || !state || !cookieState || cookieState.state !== state) return redirectWithError(request, 'google_state_mismatch');

  const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      code,
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: getGoogleRedirectUri(),
      grant_type: 'authorization_code'
    }).toString()
  });

  const tokenJson = (await tokenResponse.json()) as GoogleTokenResponse;
  if (!tokenResponse.ok || !tokenJson.access_token) return redirectWithError(request, tokenJson.error || 'google_token_failed');

  const userInfoResponse = await fetch('https://openidconnect.googleapis.com/v1/userinfo', {
    headers: { Authorization: `Bearer ${tokenJson.access_token}` }
  });
  const userInfo = (await userInfoResponse.json()) as GoogleUserInfo;
  if (!userInfoResponse.ok || !userInfo.sub || !userInfo.email) return redirectWithError(request, 'google_userinfo_failed');

  const email = normalizeEmail(userInfo.email);
  const now = Math.floor(Date.now() / 1000);
  let user = await findUserByGoogleSub(db, userInfo.sub);

  if (!user) {
    const existingByEmail = await findUserByEmail(db, email);
    if (existingByEmail) {
      await db
        .prepare('UPDATE users SET google_sub = ?, auth_provider = ?, full_name = COALESCE(full_name, ?), email_verified_at = COALESCE(email_verified_at, ?), updated_at = ? WHERE id = ?')
        .bind(userInfo.sub, 'google', userInfo.name?.trim() || null, userInfo.email_verified ? now : null, now, existingByEmail.id)
        .run();
      user = await findUserByEmail(db, email);
    } else {
      const userId = crypto.randomUUID();
      await db
        .prepare('INSERT INTO users (id, email, password_hash, email_verified_at, created_at, updated_at, disabled_at, full_name, phone, phone_normalized, auth_provider, google_sub, last_login_at) VALUES (?, ?, ?, ?, ?, ?, NULL, ?, NULL, NULL, ?, ?, ?)')
        .bind(userId, email, 'oauth_google', userInfo.email_verified ? now : null, now, now, userInfo.name?.trim() || null, 'google', userInfo.sub, now)
        .run();
      user = await findUserByEmail(db, email);
    }
  }

  if (!user) return redirectWithError(request, 'google_account_failed');
  if (user.disabled_at) return redirectWithError(request, 'account_disabled');

  const ipAddress = request.headers.get('cf-connecting-ip') ?? request.headers.get('x-forwarded-for') ?? 'unknown';
  const userAgent = request.headers.get('user-agent');
  const session = await createSession(db, user.id, ipAddress, userAgent);
  await touchLastLogin(db, user.id);

  const destination = cookieState.redirectTo && cookieState.redirectTo.startsWith('/') ? cookieState.redirectTo : '/portal/overview';
  const response = NextResponse.redirect(new URL(destination, request.url));
  clearGoogleOauthState(response);
  await setSessionCookies(response, session.jwt, session.exp);
  return response;
}
