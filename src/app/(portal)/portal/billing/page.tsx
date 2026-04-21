'use client';
export const runtime = 'edge';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';

type BillingResponse = {
  plan: string;
  plan_label: string;
  billing_status: string;
  current_period_end: number | null;
  limits: { monthlyAnalyses: number; apiKeys: number; webhooks: number };
  usage: { monthly_analyses: number; api_keys: number; webhooks: number };
};

const getCsrf = () =>
  document.cookie
    .split('; ')
    .find((cookie) => cookie.startsWith('fc_csrf='))
    ?.split('=')
    .slice(1)
    .join('=');

export default function PortalBillingPage() {
  const [state, setState] = useState<'loading' | 'error' | 'ready'>('loading');
  const [billing, setBilling] = useState<BillingResponse | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    fetch('/api/portal/billing', { cache: 'no-store' })
      .then(async (response) => {
        if (response.status === 401) {
          router.replace('/login?next=/portal/billing');
          return;
        }
        if (!response.ok) throw new Error('Failed');
        setBilling((await response.json()) as BillingResponse);
        setState('ready');
      })
      .catch(() => setState('error'));
  }, [router]);

  const usageItems = useMemo(
    () =>
      billing
        ? [
            { label: 'Monthly analyses', current: billing.usage.monthly_analyses, limit: billing.limits.monthlyAnalyses },
            { label: 'API keys', current: billing.usage.api_keys, limit: billing.limits.apiKeys },
            { label: 'Webhooks', current: billing.usage.webhooks, limit: billing.limits.webhooks }
          ]
        : [],
    [billing]
  );

  const startCheckout = async () => {
    setMessage(null);
    try {
      const csrf = getCsrf();
      const response = await fetch('/api/portal/billing/checkout', {
        method: 'POST',
        headers: csrf ? { 'x-csrf-token': decodeURIComponent(csrf) } : {}
      });
      const json = await response.json();
      if (!response.ok || !json.url) throw new Error(json?.error?.message ?? 'Checkout unavailable');
      window.location.assign(json.url as string);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Unable to start checkout');
    }
  };

  const openBillingPortal = async () => {
    setMessage(null);
    try {
      const csrf = getCsrf();
      const response = await fetch('/api/portal/billing/portal', {
        method: 'POST',
        headers: csrf ? { 'x-csrf-token': decodeURIComponent(csrf) } : {}
      });
      const json = await response.json();
      if (!response.ok || !json.url) throw new Error(json?.error?.message ?? 'Billing portal unavailable');
      window.location.assign(json.url as string);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Unable to open billing portal');
    }
  };

  if (state === 'loading') return <p>Loading billing…</p>;
  if (state === 'error' || !billing) return <p>Unable to load billing details right now.</p>;

  return (
    <section className="space-y-4">
      <h1 className="text-2xl font-semibold">Billing</h1>
      <div className="rounded border border-white/10 p-4 space-y-2">
        <p>
          Current plan: <strong>{billing.plan_label}</strong>
        </p>
        <p className="text-sm text-slate-300">Status: {billing.billing_status}</p>
        {billing.current_period_end ? <p className="text-sm text-slate-400">Current period ends: {new Date(billing.current_period_end).toLocaleDateString()}</p> : null}
        <div className="flex gap-2">
          {billing.plan === 'free' ? (
            <button type="button" onClick={startCheckout} className="rounded bg-white text-slate-900 px-3 py-1 text-sm">
              Upgrade to Pro
            </button>
          ) : (
            <button type="button" onClick={openBillingPortal} className="rounded bg-white text-slate-900 px-3 py-1 text-sm">
              Manage billing
            </button>
          )}
        </div>
        {message ? <p className="text-sm text-amber-300">{message}</p> : null}
      </div>
      <div className="rounded border border-white/10 p-4">
        <h2 className="font-medium mb-2">Usage and limits</h2>
        <ul className="space-y-1 text-sm">
          {usageItems.map((item) => (
            <li key={item.label} className="flex justify-between">
              <span>{item.label}</span>
              <span>
                {item.current}/{item.limit}
              </span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
