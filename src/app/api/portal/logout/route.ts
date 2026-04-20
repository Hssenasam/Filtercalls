import { NextRequest, NextResponse } from 'next/server';
import { clearSessionCookies, parseSessionJwt } from '@/lib/auth/portal';
import { getD1 } from '@/lib/db/d1';

export const runtime = 'edge';

export async function POST(request: NextRequest) {
  const db = getD1();
  const token = request.cookies.get('fc_session')?.value ?? request.cookies.get('__Host-fc_session')?.value;
  if (db && token) {
    const payload = await parseSessionJwt(token);
    if (payload) {
      await db.prepare('DELETE FROM sessions WHERE id = ?').bind(payload.sid).run();
    }
  }

  const response = NextResponse.json({ ok: true });
  clearSessionCookies(response);
  return response;
}
