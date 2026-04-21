export type PlanId = 'free' | 'pro';
export type BillingStatus = 'free' | 'active' | 'past_due' | 'canceled' | 'incomplete' | 'unpaid';

export type PlanLimits = {
  monthlyAnalyses: number;
  apiKeys: number;
  webhooks: number;
};

export type PlanDefinition = {
  id: PlanId;
  label: string;
  monthlyPriceUsd: number;
  limits: PlanLimits;
};

export const PLAN_DEFINITIONS: Record<PlanId, PlanDefinition> = {
  free: {
    id: 'free',
    label: 'Free',
    monthlyPriceUsd: 0,
    limits: {
      monthlyAnalyses: 250,
      apiKeys: 2,
      webhooks: 1
    }
  },
  pro: {
    id: 'pro',
    label: 'Pro',
    monthlyPriceUsd: 49,
    limits: {
      monthlyAnalyses: 10000,
      apiKeys: 25,
      webhooks: 25
    }
  }
};

export const ACTIVE_BILLING_STATUSES: BillingStatus[] = ['active'];

export const resolveEffectivePlan = (planId: string | null | undefined, status: string | null | undefined): PlanDefinition => {
  const normalizedPlan = (planId ?? 'free') as PlanId;
  const normalizedStatus = (status ?? 'free') as BillingStatus;
  if (normalizedPlan !== 'pro') return PLAN_DEFINITIONS.free;
  return ACTIVE_BILLING_STATUSES.includes(normalizedStatus) ? PLAN_DEFINITIONS.pro : PLAN_DEFINITIONS.free;
};
