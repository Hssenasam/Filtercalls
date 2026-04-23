import { NextRequest, NextResponse } from 'next/server.js';

const b64urlDecode = (text: string) => {
  const padded = text.replace(/-/g, '+').replace(/_/g, '/').padEnd(Math.ceil(text.length / 4) * 4, '=');
  const decoded = atob(padded);
  return new TextDecoder().decode(Uint8Array.from(decoded, (c) => c.charCodeAt(0)));
};

const isTokenStructurallyValid = (token: string): boolean => {
  const parts = token.split('.');
  if (parts.length !== 3) return false;
  try {
    const payload = JSON.parse(b64urlDecode(parts[1])) as { exp?: number; sid?: string; uid?: string };
    if (!payload.exp || !payload.sid || !payload.uid) return false;
    if (payload.exp < Math.floor(Date.now() / 1000)) return false;
    return true;
  } catch {
    return false;
  }
};

export function middleware(request: NextRequest) {
  const token =
    request.cookies.get('__Host-fc_session')?.value ??
    request.cookies.get('fc_session')?.value;

  if (!token || !isTokenStructurallyValid(token)) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('next', request.nextUrl.pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/portal/:path*']
};
