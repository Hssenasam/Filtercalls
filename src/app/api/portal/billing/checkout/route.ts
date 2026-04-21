import { NextRequest, NextResponse } from 'next/server.js';
import { getD1 } from '@/lib/db/d1';
import { getSessionUser, requireCsrf } from '@/lib/auth/portal';
import { createCheckoutSession, createStripeCustomer } from '@/lib/billing/stripe';
import { getBillingAccount } from '@/lib/billing/state';

export const runtime = 'edge';

export async function POST(request: NextRequest) {
  const db = getD1();
  if (!db) return NextResponse.json({ error: { code: 'DB_UNAVAILABLE', message: 'Database unavailable' } }, { status: 503 });
  if (!(await requireCsrf(request))) return NextResponse.json({ error: { code: 'FORBIDDEN', message: 'Invalid CSRF token' } }, { status: 403 });
  const user = await getSessionUser(db, request);
  if (!user) return NextResponse.json({ error: { code: 'UNAUTHORIZED', message: 'Authentication required' } }, { status: 401 });

  try {
    const account = await getBillingAccount(db, user.id);
    const customerId: string =
      account.stripe_customer_id ??
      (await createStripeCustomer(user.email, user.id).then(async (id) => {
        await db.prepare('UPDATE billing_accounts SET stripe_customer_id = ?, updated_at = ? WHERE user_id = ?').bind(id, Date.now(), user.id).run();
        return id;
      }));

    const url = await createCheckoutSession({ customerId, userId: user.id });
    return NextResponse.json({ url });
  } catch {
    return NextResponse.json({ error: { code: 'BILLING_UNAVAILABLE', message: 'Unable to start checkout right now' } }, { status: 503 });
  }
}
