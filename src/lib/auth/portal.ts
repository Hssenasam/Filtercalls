import { cookies, headers } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server.js';
import type { D1DatabaseLike } from '@/lib/db/d1';
import { sha256, secureEquals } from './api-key';
export { hashPassword, validatePasswordPolicy, verifyPassword } from './password';

const SESSION_COOKIE = 'fc_session';
const CSRF_COOKIE = 'fc_csrf';
const GOOGLE_STATE_COOKIE = 'fc_google_oauth_state';
const SESSION_TTL_SECONDS = 60 * 60 * 24 * 7;
const EMAIL_VERIFICATION_TTL_SECONDS = 60 * 60 * 24;

type JwtPayload = { sid: string; uid: string; exp: number };

export type UserRow = {
  id: string;
  email: string;
  password_hash: string;
  email_verified_at: number | null;
  disabled_at: number | null;
  full_name: string | null;
  phone: string | null;
  phone_normalized: string | null;
  auth_provider: string | null;
  google_sub: string | null;
  last_login_at: number | null;
};

const b64url = (bytes: Uint8Array) => {
  let str = '';
  bytes.forEach((b) => {
    str += String.fromCharCode(b);
  });
  return btoa(str).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
};

const fromB64url = (text: string) => {
  const padded = text.replace(/-/g, '+').replace(/_/g, '/').padEnd(Math.ceil(text.length / 4) * 4, '=');
  const decoded = atob(padded);
  return Uint8Array.from(decoded, (c) => c.charCodeAt(0));
};
const utf8 = (v: string) => new TextEncoder().encode(v);
const warnedFallbackSecrets = new Set<string>();
let ensuredSchema = false;

const getSecret = (name: 'SESSION_SECRET' | 'CSRF_SECRET') => {
  const globalRef = globalThis as unknown as {
    env?: Record<string, string>;
    ENV?: Record<string, string>;
    __env__?: Record<string, string>;
    __ENV__?: Record<string, string>;
    SESSION_SECRET?: string;
    CSRF_SECRET?: string;
  };
  return (
    process.env[name] ??
    globalRef[name] ??
    globalRef.env?.[name] ??
    globalRef.ENV?.[name] ??
    globalRef.__env__?.[name] ??
    globalRef.__ENV__?.[name] ??
    ''
  );
};

export const getGoogleClientId = () => process.env.GOOGLE_CLIENT_ID ?? '';
export const getGoogleClientSecret = () => process.env.GOOGLE_CLIENT_SECRET ?? '';

const isIgnorableSchemaError = (error: unknown) => {
  const message = error instanceof Error ? error.message.toLowerCase() : String(error).toLowerCase();
  return message.includes('duplicate column') || message.includes('already exists');
};

const runStatement = async (db: D1DatabaseLike, sql: string) => {
  await db.prepare(sql).bind().run();
};

export const ensurePortalAuthSchema = async (db: D1DatabaseLike) => {
  if (ensuredSchema) return;

  await runStatement(db, 'CREATE TABLE IF NOT EXISTS users (id TEXT PRIMARY KEY, email TEXT NOT NULL UNIQUE, password_hash TEXT NOT NULL, email_verified_at INTEGER, created_at INTEGER NOT NULL, updated_at INTEGER NOT NULL, disabled_at INTEGER)');
  await runStatement(db, 'CREATE TABLE IF NOT EXISTS sessions (id TEXT PRIMARY KEY, user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE, created_at INTEGER NOT NULL, expires_at INTEGER NOT NULL, last_seen_at INTEGER NOT NULL, user_agent TEXT, ip TEXT)');
  await runStatement(db, 'CREATE INDEX IF NOT EXISTS idx_sessions_user ON sessions(user_id)');
  await runStatement(db, 'CREATE TABLE IF NOT EXISTS password_resets (token_hash TEXT PRIMARY KEY, user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE, expires_at INTEGER NOT NULL, used_at INTEGER)');
  await runStatement(db, 'CREATE TABLE IF NOT EXISTS email_verifications (token_hash TEXT PRIMARY KEY, user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE, email TEXT NOT NULL, expires_at INTEGER NOT NULL, used_at INTEGER, created_at INTEGER NOT NULL)');
  await runStatement(db, 'CREATE INDEX IF NOT EXISTS idx_email_verifications_user ON email_verifications(user_id)');

  const alterStatements = [
    'ALTER TABLE users ADD COLUMN full_name TEXT',
    'ALTER TABLE users ADD COLUMN phone TEXT',
    'ALTER TABLE users ADD COLUMN phone_normalized TEXT',
    'ALTER TABLE users ADD COLUMN auth_provider TEXT',
    'ALTER TABLE users ADD COLUMN google_sub TEXT',
    'ALTER TABLE users ADD COLUMN last_login_at INTEGER'
  ];

  for (const statement of alterStatements) {
    try {
      await runStatement(db, statement);
    } catch (error) {
      if (!isIgnorableSchemaError(error)) throw error;
    }
  }

  await runStatement(db, 'CREATE UNIQUE INDEX IF NOT EXISTS idx_users_phone_normalized ON users(phone_normalized)');
  await runStatement(db, 'CREATE UNIQUE INDEX IF NOT EXISTS idx_users_google_sub ON users(google_sub)');
  ensuredSchema = true;
};

const sign = async (secret: string, payload: string) => {
  const resolvedSecret = secret || 'filtercalls-runtime-fallback-secret';
  if (!secret && !warnedFallbackSecrets.has('missing-secret')) {
    warnedFallbackSecrets.add('missing-secret');
    console.warn('portal auth secret missing at runtime; using fallback signing secret');
  }
  const key = await crypto.subtle.importKey('raw', utf8(resolvedSecret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const sig = await crypto.subtle.sign('HMAC', key, utf8(payload));
  return b64url(new Uint8Array(sig));
};

const verifyHmac = async (secret: string, payload: string, signature: string) => {
  const expected = await sign(secret, payload);
  return secureEquals(expected, signature);
};

export const maskEmail = (email: string) => {
  const [name, domain] = email.split('@');
  if (!name || !domain) return '***';
  return `${name[0]}***@${domain}`;
};

export const normalizeEmail = (email: string) => email.trim().toLowerCase();
export const normalizePhone = (value: string) => {
  const trimmed = value.trim();
  if (!trimmed) return null;
  const prefixed = trimmed.startsWith('+') ? `+${trimmed.slice(1).replace(/\D/g, '')}` : trimmed.replace(/\D/g, '');
  const normalized = prefixed.replace(/(?!^)\+/g, '');
  if (normalized.replace(/\D/g, '').length < 8) return null;
  return normalized;
};
export const isEmailIdentifier = (value: string) => value.includes('@');

const mapUserRow = (row: Record<string, unknown> | null): UserRow | null => {
  if (!row) return null;
  return {
    id: String(row.id ?? ''),
    email: String(row.email ?? ''),
    password_hash: String(row.password_hash ?? ''),
    email_verified_at: row.email_verified_at == null ? null : Number(row.email_verified_at),
    disabled_at: row.disabled_at == null ? null : Number(row.disabled_at),
    full_name: row.full_name == null ? null : String(row.full_name),
    phone: row.phone == null ? null : String(row.phone),
    phone_normalized: row.phone_normalized == null ? null : String(row.phone_normalized),
    auth_provider: row.auth_provider == null ? null : String(row.auth_provider),
    google_sub: row.google_sub == null ? null : String(row.google_sub),
    last_login_at: row.last_login_at == null ? null : Number(row.last_login_at)
  };
};

export const signSessionJwt = async (payload: JwtPayload) => {
  const header = { alg: 'HS256', typ: 'JWT' };
  const secret = getSecret('SESSION_SECRET');
  const encodedHeader = b64url(utf8(JSON.stringify(header)));
  const encodedPayload = b64url(utf8(JSON.stringify(payload)));
  const body = `${encodedHeader}.${encodedPayload}`;
  const signature = await sign(secret, body);
  return `${body}.${signature}`;
};

export const parseSessionJwt = async (token: string): Promise<JwtPayload | null> => {
  const [h, p, s] = token.split('.');
  if (!h || !p || !s) return null;
  const body = `${h}.${p}`;
  if (!(await verifyHmac(getSecret('SESSION_SECRET'), body, s))) return null;

  try {
    const payload = JSON.parse(new TextDecoder().decode(fromB64url(p))) as JwtPayload;
    if (payload.exp < Math.floor(Date.now() / 1000)) return null;
    return payload;
  } catch {
    return null;
  }
};

export const createSession = async (db: D1DatabaseLike, userId: string, ip: string | null, userAgent: string | null) => {
  const id = crypto.randomUUID();
  const now = Math.floor(Date.now() / 1000);
  const exp = now + SESSION_TTL_SECONDS;
  await ensurePortalAuthSchema(db);
  try {
    await db.prepare('INSERT INTO sessions (id, user_id, created_at, expires_at, last_seen_at, user_agent, ip) VALUES (?, ?, ?, ?, ?, ?, ?)').bind(id, userId, now, exp, now, userAgent, ip).run();
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    if (!message.includes('no such table: sessions')) throw error;
    await db.prepare('CREATE TABLE IF NOT EXISTS sessions (id TEXT PRIMARY KEY, user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE, created_at INTEGER NOT NULL, expires_at INTEGER NOT NULL, last_seen_at INTEGER NOT NULL, user_agent TEXT, ip TEXT)').bind().run();
    await db.prepare('CREATE INDEX IF NOT EXISTS idx_sessions_user ON sessions(user_id)').bind().run();
    await db.prepare('INSERT INTO sessions (id, user_id, created_at, expires_at, last_seen_at, user_agent, ip) VALUES (?, ?, ?, ?, ?, ?, ?)').bind(id, userId, now, exp, now, userAgent, ip).run();
  }
  const jwt = await signSessionJwt({ sid: id, uid: userId, exp });
  return { id, jwt, exp };
};

export const issueCsrfToken = async (response: NextResponse) => {
  const secret = getSecret('CSRF_SECRET');
  const random = crypto.randomUUID();
  const token = `${random}.${await sign(secret, random)}`;
  response.cookies.set(CSRF_COOKIE, token, { secure: true, sameSite: 'lax', path: '/' });
  return token;
};

export const requireCsrf = async (request: NextRequest) => {
  const cookie = request.cookies.get(CSRF_COOKIE)?.value;
  const header = request.headers.get('x-csrf-token');
  if (!cookie || !header || cookie !== header) return false;
  const [nonce, signature] = cookie.split('.');
  if (!nonce || !signature) return false;
  return verifyHmac(getSecret('CSRF_SECRET'), nonce, signature);
};

export const getSessionUser = async (db: D1DatabaseLike, request: NextRequest): Promise<UserRow | null> => {
  await ensurePortalAuthSchema(db);
  const token = request.cookies.get(SESSION_COOKIE)?.value ?? request.cookies.get('__Host-fc_session')?.value;
  if (!token) return null;

  const payload = await parseSessionJwt(token);
  if (!payload) return null;

  const now = Math.floor(Date.now() / 1000);
  const session = await db.prepare('SELECT id, user_id, expires_at FROM sessions WHERE id = ?').bind(payload.sid).first<{ id: string; user_id: string; expires_at: number }>();
  if (!session || session.expires_at < now || session.user_id !== payload.uid) return null;

  await db.prepare('UPDATE sessions SET last_seen_at = ?, expires_at = ? WHERE id = ?').bind(now, now + SESSION_TTL_SECONDS, session.id).run();

  const user = await db.prepare('SELECT id, email, password_hash, email_verified_at, disabled_at, full_name, phone, phone_normalized, auth_provider, google_sub, last_login_at FROM users WHERE id = ?').bind(payload.uid).first<Record<string, unknown>>();
  const mapped = mapUserRow(user);
  if (!mapped || mapped.disabled_at) return null;
  return mapped;
};

export const setSessionCookies = async (response: NextResponse, jwt: string, exp: number) => {
  const cookieName = process.env.NODE_ENV === 'production' ? '__Host-fc_session' : SESSION_COOKIE;
  response.cookies.set(cookieName, jwt, {
    httpOnly: true,
    secure: true,
    sameSite: 'lax',
    path: '/',
    expires: new Date(exp * 1000)
  });
  const token = await issueCsrfToken(response);
  response.headers.set('x-csrf-token', token);
};

export const clearSessionCookies = (response: NextResponse) => {
  response.cookies.set(SESSION_COOKIE, '', { httpOnly: true, secure: true, sameSite: 'lax', path: '/', expires: new Date(0) });
  response.cookies.set('__Host-fc_session', '', { httpOnly: true, secure: true, sameSite: 'lax', path: '/', expires: new Date(0) });
  response.cookies.set(CSRF_COOKIE, '', { secure: true, sameSite: 'lax', path: '/', expires: new Date(0) });
};

export const getClientIp = async () => (await headers()).get('cf-connecting-ip') ?? (await headers()).get('x-forwarded-for') ?? 'unknown';

export const getPortalBaseUrl = () => process.env.PORTAL_BASE_URL ?? 'http://localhost:3000';

export const getGoogleRedirectUri = () => `${getPortalBaseUrl()}/api/portal/oauth/google/callback`;

export const findUserByEmail = async (db: D1DatabaseLike, email: string) => {
  await ensurePortalAuthSchema(db);
  return mapUserRow(await db.prepare('SELECT id, email, password_hash, email_verified_at, disabled_at, full_name, phone, phone_normalized, auth_provider, google_sub, last_login_at FROM users WHERE email = ? LIMIT 1').bind(normalizeEmail(email)).first<Record<string, unknown>>());
};

export const findUserByPhone = async (db: D1DatabaseLike, phone: string) => {
  await ensurePortalAuthSchema(db);
  const normalized = normalizePhone(phone);
  if (!normalized) return null;
  return mapUserRow(await db.prepare('SELECT id, email, password_hash, email_verified_at, disabled_at, full_name, phone, phone_normalized, auth_provider, google_sub, last_login_at FROM users WHERE phone_normalized = ? LIMIT 1').bind(normalized).first<Record<string, unknown>>());
};

export const findUserByIdentifier = async (db: D1DatabaseLike, identifier: string) => {
  return isEmailIdentifier(identifier) ? findUserByEmail(db, identifier) : findUserByPhone(db, identifier);
};

export const findUserByGoogleSub = async (db: D1DatabaseLike, googleSub: string) => {
  await ensurePortalAuthSchema(db);
  return mapUserRow(await db.prepare('SELECT id, email, password_hash, email_verified_at, disabled_at, full_name, phone, phone_normalized, auth_provider, google_sub, last_login_at FROM users WHERE google_sub = ? LIMIT 1').bind(googleSub).first<Record<string, unknown>>());
};

export const touchLastLogin = async (db: D1DatabaseLike, userId: string) => {
  await ensurePortalAuthSchema(db);
  const now = Math.floor(Date.now() / 1000);
  await db.prepare('UPDATE users SET last_login_at = ?, updated_at = ? WHERE id = ?').bind(now, now, userId).run();
};

export const genericAuthError = { error: { code: 'UNAUTHORIZED', message: 'Invalid credentials' } };

export const getRequestMeta = async () => ({ ip: await getClientIp(), userAgent: (await headers()).get('user-agent') });

export const hashToken = (token: string) => sha256(token);

export const getServerCookie = async (name: string) => (await cookies()).get(name)?.value;

export const createEmailVerification = async (db: D1DatabaseLike, userId: string, email: string) => {
  await ensurePortalAuthSchema(db);
  const token = crypto.randomUUID().replace(/-/g, '') + crypto.randomUUID().replace(/-/g, '');
  const tokenHash = await hashToken(token);
  const now = Math.floor(Date.now() / 1000);
  const expires = now + EMAIL_VERIFICATION_TTL_SECONDS;
  await db.prepare('DELETE FROM email_verifications WHERE user_id = ?').bind(userId).run();
  await db.prepare('INSERT INTO email_verifications (token_hash, user_id, email, expires_at, used_at, created_at) VALUES (?, ?, ?, ?, NULL, ?)').bind(tokenHash, userId, normalizeEmail(email), expires, now).run();
  return { token, expires_at: expires, verify_url: `${getPortalBaseUrl()}/verify-email?token=${encodeURIComponent(token)}` };
};

export const consumeEmailVerification = async (db: D1DatabaseLike, token: string) => {
  await ensurePortalAuthSchema(db);
  const tokenHash = await hashToken(token);
  const now = Math.floor(Date.now() / 1000);
  const row = await db.prepare('SELECT token_hash, user_id, email, expires_at, used_at FROM email_verifications WHERE token_hash = ? LIMIT 1').bind(tokenHash).first<{ token_hash: string; user_id: string; email: string; expires_at: number; used_at: number | null }>();
  if (!row || row.used_at || row.expires_at < now) return null;
  await db.prepare('UPDATE email_verifications SET used_at = ? WHERE token_hash = ?').bind(now, tokenHash).run();
  await db.prepare('UPDATE users SET email_verified_at = ?, updated_at = ? WHERE id = ?').bind(now, now, row.user_id).run();
  return row;
};

export const issueGoogleOauthState = (response: NextResponse, redirectTo?: string | null) => {
  const state = crypto.randomUUID().replace(/-/g, '');
  response.cookies.set(GOOGLE_STATE_COOKIE, JSON.stringify({ state, redirectTo: redirectTo || '/portal/overview' }), {
    httpOnly: true,
    secure: true,
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 10
  });
  return state;
};

export const readGoogleOauthState = (request: NextRequest) => {
  const raw = request.cookies.get(GOOGLE_STATE_COOKIE)?.value;
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as { state: string; redirectTo?: string };
    return parsed;
  } catch {
    return null;
  }
};

export const clearGoogleOauthState = (response: NextResponse) => {
  response.cookies.set(GOOGLE_STATE_COOKIE, '', { httpOnly: true, secure: true, sameSite: 'lax', path: '/', expires: new Date(0) });
};
