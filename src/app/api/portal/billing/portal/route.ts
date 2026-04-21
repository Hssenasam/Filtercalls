import { NextRequest, NextResponse } from 'next/server.js';
import { getD1 } from '@/lib/db/d1';
import { getSessionUser, requireCsrf } from '@/lib/auth/portal';
import { createBillingPortalSession } from '@/lib/billing/stripe';
import { getBillingAccount } from '@/lib/billing/state';

export const runtime = 'edge';

export async function POST(request: NextRequest) {
  const db = getD1();
  if (!db) return NextResponse.json({ error: { code: 'DB_UNAVAILABLE', message: 'Database unavailable' } }, { status: 503 });
  if (!(await requireCsrf(request))) return NextResponse.json({ error: { code: 'FORBIDDEN', message: 'Invalid CSRF token' } }, { status: 403 });
  const user = await getSessionUser(db, request);
  if (!user) return NextResponse.json({ error: { code: 'UNAUTHORIZED', message: 'Authentication required' } }, { status: 401 });

  const account = await getBillingAccount(db, user.id);
  if (!account.stripe_customer_id) {
    return NextResponse.json({ error: { code: 'NO_BILLING_ACCOUNT', message: 'Upgrade first to access billing portal' } }, { status: 400 });
  }

  try {
    const url = await createBillingPortalSession(account.stripe_customer_id);
    return NextResponse.json({ url });
  } catch {
    return NextResponse.json({ error: { code: 'BILLING_UNAVAILABLE', message: 'Unable to open billing portal right now' } }, { status: 503 });
  }
}
