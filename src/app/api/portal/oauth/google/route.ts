import { NextRequest, NextResponse } from 'next/server.js';
import { getGoogleClientId, getGoogleRedirectUri, issueGoogleOauthState } from '@/lib/auth/portal';

export const runtime = 'edge';

export async function GET(request: NextRequest) {
  const clientId = getGoogleClientId();
  if (!clientId) {
    return NextResponse.redirect(new URL('/login?error=google_not_configured', request.url));
  }

  const redirectTo = request.nextUrl.searchParams.get('redirect_to') || '/portal/overview';
  const response = NextResponse.next();
  const state = issueGoogleOauthState(response, redirectTo);
  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: getGoogleRedirectUri(),
    response_type: 'code',
    scope: 'openid email profile',
    access_type: 'online',
    prompt: 'select_account',
    state
  });

  const target = `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
  return NextResponse.redirect(target, { headers: response.headers });
}
