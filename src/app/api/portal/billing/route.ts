import { NextRequest, NextResponse } from 'next/server.js';
import { getD1 } from '@/lib/db/d1';
import { getSessionUser, requireCsrf } from '@/lib/auth/portal';
import { getBillingAccount, getEffectivePlanForUser, getMonthlyUsage, getResourceCounts } from '@/lib/billing/state';

export const runtime = 'edge';

export async function GET(request: NextRequest) {
  const db = getD1();
  if (!db) return NextResponse.json({ error: { code: 'DB_UNAVAILABLE', message: 'Database unavailable' } }, { status: 503 });
  const user = await getSessionUser(db, request);
  if (!user) return NextResponse.json({ error: { code: 'UNAUTHORIZED', message: 'Authentication required' } }, { status: 401 });

  const [{ account, plan }, usage, resources] = await Promise.all([
    getEffectivePlanForUser(db, user.id),
    getMonthlyUsage(db, user.id),
    getResourceCounts(db, user.id)
  ]);

  return NextResponse.json({
    plan: plan.id,
    plan_label: plan.label,
    billing_status: account.billing_status,
    stripe_customer_id: account.stripe_customer_id,
    current_period_end: account.current_period_end,
    cancel_at_period_end: account.cancel_at_period_end,
    limits: plan.limits,
    usage: {
      monthly_analyses: usage,
      api_keys: resources.apiKeys,
      webhooks: resources.webhooks
    }
  });
}

export async function POST(request: NextRequest) {
  const db = getD1();
  if (!db) return NextResponse.json({ error: { code: 'DB_UNAVAILABLE', message: 'Database unavailable' } }, { status: 503 });
  if (!(await requireCsrf(request))) return NextResponse.json({ error: { code: 'FORBIDDEN', message: 'Invalid CSRF token' } }, { status: 403 });
  const user = await getSessionUser(db, request);
  if (!user) return NextResponse.json({ error: { code: 'UNAUTHORIZED', message: 'Authentication required' } }, { status: 401 });
  const account = await getBillingAccount(db, user.id);
  return NextResponse.json({ ok: true, plan: account.plan_id, status: account.billing_status });
}
