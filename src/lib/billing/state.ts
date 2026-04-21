import type { D1DatabaseLike } from '@/lib/db/d1';
import { PLAN_DEFINITIONS, resolveEffectivePlan, type BillingStatus, type PlanDefinition } from './plans';

export type BillingAccountRow = {
  user_id: string;
  plan_id: string;
  billing_status: string;
  stripe_customer_id: string | null;
  stripe_subscription_id: string | null;
  current_period_end: number | null;
  cancel_at_period_end: number | null;
  created_at: number;
  updated_at: number;
};

const monthStartMs = () => {
  const now = new Date();
  return Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1, 0, 0, 0, 0);
};

export const ensureBillingAccount = async (db: D1DatabaseLike, userId: string) => {
  const now = Date.now();
  await db
    .prepare(
      'INSERT OR IGNORE INTO billing_accounts (user_id, plan_id, billing_status, stripe_customer_id, stripe_subscription_id, current_period_end, cancel_at_period_end, created_at, updated_at) VALUES (?, ?, ?, NULL, NULL, NULL, NULL, ?, ?)'
    )
    .bind(userId, 'free', 'free', now, now)
    .run();
};

export const getBillingAccount = async (db: D1DatabaseLike, userId: string): Promise<BillingAccountRow> => {
  await ensureBillingAccount(db, userId);
  const row = await db
    .prepare(
      'SELECT user_id, plan_id, billing_status, stripe_customer_id, stripe_subscription_id, current_period_end, cancel_at_period_end, created_at, updated_at FROM billing_accounts WHERE user_id = ? LIMIT 1'
    )
    .bind(userId)
    .first<BillingAccountRow>();
  if (!row) {
    return {
      user_id: userId,
      plan_id: 'free',
      billing_status: 'free',
      stripe_customer_id: null,
      stripe_subscription_id: null,
      current_period_end: null,
      cancel_at_period_end: null,
      created_at: Date.now(),
      updated_at: Date.now()
    };
  }
  return row;
};

export const getEffectivePlanForUser = async (db: D1DatabaseLike, userId: string): Promise<{ account: BillingAccountRow; plan: PlanDefinition }> => {
  const account = await getBillingAccount(db, userId);
  const plan = resolveEffectivePlan(account.plan_id, account.billing_status);
  return { account, plan };
};

export const getMonthlyUsage = async (db: D1DatabaseLike, userId: string) => {
  const since = monthStartMs();
  const usage = await db
    .prepare('SELECT COUNT(*) as total FROM analyses WHERE user_id = ? AND created_at >= ?')
    .bind(userId, since)
    .first<{ total: number }>();
  return Number(usage?.total ?? 0);
};

export const getResourceCounts = async (db: D1DatabaseLike, userId: string) => {
  const [keys, webhooks] = await Promise.all([
    db.prepare('SELECT COUNT(*) as total FROM api_keys WHERE user_id = ? AND revoked_at IS NULL').bind(userId).first<{ total: number }>(),
    db.prepare('SELECT COUNT(*) as total FROM webhooks WHERE user_id = ? AND disabled_at IS NULL').bind(userId).first<{ total: number }>()
  ]);
  return { apiKeys: Number(keys?.total ?? 0), webhooks: Number(webhooks?.total ?? 0) };
};

export const assertLimit = async (db: D1DatabaseLike, userId: string, input: { type: 'analyses' | 'api_keys' | 'webhooks'; amount?: number }) => {
  const { plan } = await getEffectivePlanForUser(db, userId);
  if (input.type === 'analyses') {
    const current = await getMonthlyUsage(db, userId);
    const next = current + Math.max(1, input.amount ?? 1);
    if (next > plan.limits.monthlyAnalyses) {
      return { ok: false as const, plan, current, limit: plan.limits.monthlyAnalyses };
    }
    return { ok: true as const, plan, current, limit: plan.limits.monthlyAnalyses };
  }
  const counts = await getResourceCounts(db, userId);
  if (input.type === 'api_keys') {
    if (counts.apiKeys >= plan.limits.apiKeys) return { ok: false as const, plan, current: counts.apiKeys, limit: plan.limits.apiKeys };
    return { ok: true as const, plan, current: counts.apiKeys, limit: plan.limits.apiKeys };
  }
  if (counts.webhooks >= plan.limits.webhooks) return { ok: false as const, plan, current: counts.webhooks, limit: plan.limits.webhooks };
  return { ok: true as const, plan, current: counts.webhooks, limit: plan.limits.webhooks };
};

export const normalizeStripeStatus = (status: string | null | undefined): BillingStatus => {
  if (!status) return 'free';
  if (['active', 'past_due', 'canceled', 'incomplete', 'unpaid'].includes(status)) return status as BillingStatus;
  return 'free';
};

export const proPlanOrFree = (priceId: string | null | undefined, configuredProPriceId: string | null | undefined) =>
  priceId && configuredProPriceId && priceId === configuredProPriceId ? 'pro' : 'free';

export const defaultPlan = PLAN_DEFINITIONS.free;
