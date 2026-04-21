import { NextRequest, NextResponse } from 'next/server.js';

export function middleware(request: NextRequest) {
  const token = request.cookies.get('__Host-fc_session')?.value ?? request.cookies.get('fc_session')?.value;
  if (!token) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('next', request.nextUrl.pathname);
    return NextResponse.redirect(loginUrl);
  }
  return NextResponse.next();
}

export const config = {
  matcher: ['/portal/:path*']
};
