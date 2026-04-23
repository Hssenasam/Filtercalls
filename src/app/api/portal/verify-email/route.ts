import { NextRequest, NextResponse } from 'next/server.js';
import { consumeEmailVerification, ensurePortalAuthSchema } from '@/lib/auth/portal';
import { getD1 } from '@/lib/db/d1';

export const runtime = 'edge';

export async function GET(request: NextRequest) {
  const token = request.nextUrl.searchParams.get('token');
  const db = getD1();
  if (!db || !token) return NextResponse.json({ error: { code: 'INVALID_INPUT', message: 'Missing token' } }, { status: 400 });
  await ensurePortalAuthSchema(db);

  const result = await consumeEmailVerification(db, token);
  if (!result) return NextResponse.json({ error: { code: 'INVALID_TOKEN', message: 'Invalid or expired verification link' } }, { status: 400 });

  return NextResponse.json({ ok: true, email: result.email }, { status: 200 });
}
