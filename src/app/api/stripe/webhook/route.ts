import { NextRequest, NextResponse } from 'next/server.js';
import { getD1 } from '@/lib/db/d1';
import { normalizeStripeStatus, proPlanOrFree } from '@/lib/billing/state';
import { stripeConfig, verifyStripeWebhookSignature } from '@/lib/billing/stripe';

export const runtime = 'edge';

type StripeEvent = {
  id: string;
  type: string;
  data?: {
    object?: Record<string, unknown>;
  };
};

const upsertFromSubscription = async (db: NonNullable<ReturnType<typeof getD1>>, event: StripeEvent) => {
  const object = event.data?.object ?? {};
  const customerId = String(object.customer ?? '');
  if (!customerId) return;
  const subscriptionId = String(object.id ?? '');
  const status = normalizeStripeStatus(String(object.status ?? 'free'));
  const priceId =
    (object.items as { data?: Array<{ price?: { id?: string } }> } | undefined)?.data?.[0]?.price?.id ??
    (object.plan as { id?: string } | undefined)?.id ??
    null;
  const { proPriceId } = stripeConfig();
  const planId = proPlanOrFree(priceId ? String(priceId) : null, proPriceId);
  const periodEnd = object.current_period_end ? Number(object.current_period_end) * 1000 : null;
  const cancelAtPeriodEnd = object.cancel_at_period_end ? Date.now() : null;
  await db
    .prepare(
      'UPDATE billing_accounts SET plan_id = ?, billing_status = ?, stripe_subscription_id = ?, current_period_end = ?, cancel_at_period_end = ?, updated_at = ? WHERE stripe_customer_id = ?'
    )
    .bind(planId, status, subscriptionId || null, periodEnd, cancelAtPeriodEnd, Date.now(), customerId)
    .run();
};

const applyInvoiceStatus = async (db: NonNullable<ReturnType<typeof getD1>>, event: StripeEvent) => {
  const object = event.data?.object ?? {};
  const customerId = String(object.customer ?? '');
  if (!customerId) return;
  const failed = event.type === 'invoice.payment_failed';
  await db
    .prepare('UPDATE billing_accounts SET billing_status = ?, updated_at = ? WHERE stripe_customer_id = ?')
    .bind(failed ? 'past_due' : 'active', Date.now(), customerId)
    .run();
};

export async function POST(request: NextRequest) {
  const db = getD1();
  if (!db) return NextResponse.json({ error: { code: 'DB_UNAVAILABLE', message: 'Database unavailable' } }, { status: 503 });
  const payload = await request.text();
  const signature = request.headers.get('stripe-signature');
  const verified = await verifyStripeWebhookSignature(signature, payload);
  if (!verified) return NextResponse.json({ error: { code: 'INVALID_SIGNATURE', message: 'Invalid webhook signature' } }, { status: 400 });

  const event = JSON.parse(payload) as StripeEvent;
  const existing = await db.prepare('SELECT id FROM billing_events WHERE id = ? LIMIT 1').bind(event.id).first<{ id: string }>();
  if (existing) return NextResponse.json({ ok: true, duplicate: true });
  await db.prepare('INSERT INTO billing_events (id, type, created_at) VALUES (?, ?, ?)').bind(event.id, event.type, Date.now()).run();

  if (
    event.type === 'customer.subscription.created' ||
    event.type === 'customer.subscription.updated' ||
    event.type === 'customer.subscription.deleted'
  ) {
    await upsertFromSubscription(db, event);
  }
  if (event.type === 'invoice.payment_failed' || event.type === 'invoice.payment_succeeded') await applyInvoiceStatus(db, event);

  return NextResponse.json({ ok: true });
}
