import { NextRequest, NextResponse } from 'next/server.js';

type JwtPayload = { sid?: unknown; uid?: unknown; exp?: unknown };

const utf8 = (value: string) => new TextEncoder().encode(value);

const b64urlEncode = (bytes: Uint8Array) => {
  let binary = '';
  bytes.forEach((byte) => {
    binary += String.fromCharCode(byte);
  });
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
};

const b64urlDecodeToString = (text: string) => {
  const padded = text.replace(/-/g, '+').replace(/_/g, '/').padEnd(Math.ceil(text.length / 4) * 4, '=');
  const decoded = atob(padded);
  return new TextDecoder().decode(Uint8Array.from(decoded, (char) => char.charCodeAt(0)));
};

const safeEquals = (left: string, right: string) => {
  if (left.length !== right.length) return false;

  let mismatch = 0;
  for (let index = 0; index < left.length; index += 1) {
    mismatch |= left.charCodeAt(index) ^ right.charCodeAt(index);
  }
  return mismatch === 0;
};

const getSessionSecret = () => {
  const globalRef = globalThis as unknown as {
    env?: Record<string, string>;
    ENV?: Record<string, string>;
    __env__?: Record<string, string>;
    __ENV__?: Record<string, string>;
    SESSION_SECRET?: string;
  };

  return (
    process.env.SESSION_SECRET ??
    globalRef.SESSION_SECRET ??
    globalRef.env?.SESSION_SECRET ??
    globalRef.ENV?.SESSION_SECRET ??
    globalRef.__env__?.SESSION_SECRET ??
    globalRef.__ENV__?.SESSION_SECRET ??
    'filtercalls-runtime-fallback-secret'
  );
};

const signHmac = async (payload: string) => {
  const key = await crypto.subtle.importKey('raw', utf8(getSessionSecret()), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const signature = await crypto.subtle.sign('HMAC', key, utf8(payload));
  return b64urlEncode(new Uint8Array(signature));
};

const verifySessionJwt = async (token: string): Promise<boolean> => {
  const [header, payload, signature] = token.split('.');
  if (!header || !payload || !signature) return false;

  const signedPayload = `${header}.${payload}`;
  const expectedSignature = await signHmac(signedPayload);
  if (!safeEquals(expectedSignature, signature)) return false;

  try {
    const parsed = JSON.parse(b64urlDecodeToString(payload)) as JwtPayload;
    if (typeof parsed.sid !== 'string' || !parsed.sid) return false;
    if (typeof parsed.uid !== 'string' || !parsed.uid) return false;
    if (typeof parsed.exp !== 'number') return false;
    if (parsed.exp < Math.floor(Date.now() / 1000)) return false;
    return true;
  } catch {
    return false;
  }
};

export async function middleware(request: NextRequest) {
  const token =
    request.cookies.get('__Host-fc_session')?.value ??
    request.cookies.get('fc_session')?.value;

  if (!token || !(await verifySessionJwt(token))) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('next', `${request.nextUrl.pathname}${request.nextUrl.search}`);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/portal/:path*']
};
