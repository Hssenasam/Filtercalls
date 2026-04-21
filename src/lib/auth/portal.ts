import { cookies, headers } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server.js';
import type { D1DatabaseLike } from '@/lib/db/d1';
import { sha256, secureEquals } from './api-key';
export { hashPassword, validatePasswordPolicy, verifyPassword } from './password';

const SESSION_COOKIE = 'fc_session';
const CSRF_COOKIE = 'fc_csrf';
const SESSION_TTL_SECONDS = 60 * 60 * 24 * 7;

type JwtPayload = { sid: string; uid: string; exp: number };

type UserRow = {
  id: string;
  email: string;
  password_hash: string;
  email_verified_at: number | null;
  disabled_at: number | null;
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

const getSecret = (name: 'SESSION_SECRET' | 'CSRF_SECRET') => {
  const globalRef = globalThis as unknown as { env?: Record<string, string>; ENV?: Record<string, string> };
  return process.env[name] ?? globalRef.env?.[name] ?? globalRef.ENV?.[name] ?? '';
};

const sign = async (secret: string, payload: string) => {
  const key = await crypto.subtle.importKey('raw', utf8(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
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
  await db.prepare('INSERT INTO sessions (id, user_id, created_at, expires_at, last_seen_at, user_agent, ip) VALUES (?, ?, ?, ?, ?, ?, ?)').bind(id, userId, now, exp, now, userAgent, ip).run();
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
  const token = request.cookies.get(SESSION_COOKIE)?.value ?? request.cookies.get('__Host-fc_session')?.value;
  if (!token) return null;

  const payload = await parseSessionJwt(token);
  if (!payload) return null;

  const now = Math.floor(Date.now() / 1000);
  const session = await db.prepare('SELECT id, user_id, expires_at FROM sessions WHERE id = ?').bind(payload.sid).first<{ id: string; user_id: string; expires_at: number }>();
  if (!session || session.expires_at < now || session.user_id !== payload.uid) return null;

  await db.prepare('UPDATE sessions SET last_seen_at = ?, expires_at = ? WHERE id = ?').bind(now, now + SESSION_TTL_SECONDS, session.id).run();

  const user = await db.prepare('SELECT id, email, password_hash, email_verified_at, disabled_at FROM users WHERE id = ?').bind(payload.uid).first<UserRow>();
  if (!user || user.disabled_at) return null;
  return user;
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

export const findUserByEmail = async (db: D1DatabaseLike, email: string) =>
  db.prepare('SELECT id, email, password_hash, email_verified_at, disabled_at FROM users WHERE email = ? LIMIT 1').bind(email.toLowerCase().trim()).first<UserRow>();

export const genericAuthError = { error: { code: 'UNAUTHORIZED', message: 'Invalid credentials' } };

export const getRequestMeta = async () => ({ ip: await getClientIp(), userAgent: (await headers()).get('user-agent') });

export const hashToken = (token: string) => sha256(token);

export const getServerCookie = async (name: string) => (await cookies()).get(name)?.value;
