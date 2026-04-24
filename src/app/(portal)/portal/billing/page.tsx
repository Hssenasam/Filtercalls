'use client';
export const runtime = 'edge';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { CustomPlanForm } from '@/components/contact/custom-plan-form';
import { PLAN_DEFINITIONS } from '@/lib/billing/plans';

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
  const freePlan = PLAN_DEFINITIONS.free;
  const proPlan = PLAN_DEFINITIONS.pro;

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
    <section className="space-y-8">
      <div className="rounded-[2rem] border border-white/10 bg-gradient-to-br from-slate-900 to-slate-950 p-6 sm:p-8">
        <p className="text-xs font-medium uppercase tracking-[0.24em] text-sky-300/80">Billing & plans</p>
        <h1 className="mt-3 text-3xl font-semibold text-white sm:text-4xl">Choose the right volume for your workflow</h1>
        <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-300 sm:text-base">Free gives you a focused trial, Pro unlocks more automation, and Custom is for higher-volume or company-specific requests.</p>
        <div className="mt-5 flex flex-wrap gap-3 text-sm text-slate-300">
          <span className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5">Current plan: {billing.plan_label}</span>
          <span className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5">{billing.usage.monthly_analyses}/{billing.limits.monthlyAnalyses} analyses used</span>
          <span className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5">Status: {billing.billing_status}</span>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1fr_1fr_1.1fr]">
        <div className="rounded-[2rem] border border-white/10 bg-white/[0.03] p-6 sm:p-8">
          <p className="text-sm font-medium text-white">Free</p>
          <p className="mt-3 text-4xl font-semibold text-white">$0</p>
          <p className="mt-1 text-sm text-slate-400">For light testing and getting started.</p>
          <ul className="mt-5 space-y-3 text-sm text-slate-300">
            <li>• {freePlan.limits.monthlyAnalyses.toLocaleString()} analyses / month</li>
            <li>• {freePlan.limits.apiKeys} API key</li>
            <li>• {freePlan.limits.webhooks} webhook</li>
            <li>• Core dashboard access</li>
          </ul>
          <div className="mt-6 rounded-2xl border border-white/10 bg-slate-900/60 px-4 py-3 text-sm text-slate-300">Good fit if you are validating the product, testing the API, or making first integrations.</div>
        </div>

        <div className="rounded-[2rem] border border-sky-400/20 bg-gradient-to-br from-sky-500/10 to-indigo-500/10 p-6 shadow-lg shadow-sky-950/15 sm:p-8">
          <div className="flex items-center justify-between gap-3">
            <p className="text-sm font-medium text-white">Pro</p>
            <span className="rounded-full border border-sky-400/20 bg-sky-400/10 px-3 py-1 text-xs font-medium text-sky-200">Recommended</span>
          </div>
          <p className="mt-3 text-4xl font-semibold text-white">${proPlan.monthlyPriceUsd}</p>
          <p className="mt-1 text-sm text-slate-300">Per month for higher volume and stronger automation.</p>
          <ul className="mt-5 space-y-3 text-sm text-slate-200">
            <li>• {proPlan.limits.monthlyAnalyses.toLocaleString()} analyses / month</li>
            <li>• {proPlan.limits.apiKeys} API keys</li>
            <li>• {proPlan.limits.webhooks} webhooks</li>
            <li>• Better room for production usage</li>
          </ul>
          <div className="mt-6 rounded-2xl border border-sky-400/15 bg-sky-400/10 px-4 py-3 text-sm text-sky-100">Upgrade when your monthly volume is growing or you need more endpoints and keys.</div>
          <div className="mt-6">
            {billing.plan === 'free' ? (
              <button type="button" onClick={startCheckout} className="w-full rounded-2xl bg-gradient-to-r from-sky-500 via-blue-500 to-indigo-500 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-blue-950/35">Upgrade to Pro</button>
            ) : (
              <button type="button" onClick={openBillingPortal} className="w-full rounded-2xl bg-gradient-to-r from-sky-500 via-blue-500 to-indigo-500 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-blue-950/35">Manage Pro billing</button>
            )}
          </div>
        </div>

        <div id="custom-plan" className="rounded-[2rem] border border-white/10 bg-white/[0.03] p-6 sm:p-8">
          <p className="text-sm font-medium text-white">Custom</p>
          <p className="mt-3 text-3xl font-semibold text-white">Need something bigger or tailored?</p>
          <p className="mt-2 text-sm leading-7 text-slate-300">For higher monthly volume, special routing, company workflows, or custom requests, use this dedicated request form.</p>
          <div className="mt-6">
            <CustomPlanForm />
          </div>
        </div>
      </div>

      <div className="rounded-[2rem] border border-white/10 bg-white/[0.03] p-6 sm:p-8">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <p className="text-xs font-medium uppercase tracking-[0.24em] text-slate-400">Plan comparison</p>
            <h2 className="mt-2 text-2xl font-semibold text-white">Upgrade when the free tier starts feeling tight</h2>
            <p className="mt-2 max-w-2xl text-sm leading-7 text-slate-300">Free includes {freePlan.limits.monthlyAnalyses.toLocaleString()} analyses per month. Pro opens more volume and automation. Custom handles larger or more specialized requests.</p>
          </div>
          {billing.current_period_end ? <p className="text-sm text-slate-400">Current period ends: {new Date(billing.current_period_end).toLocaleDateString()}</p> : null}
        </div>
        <div className="mt-6 overflow-hidden rounded-3xl border border-white/10">
          <div className="grid grid-cols-[1.2fr_0.9fr_0.9fr_0.9fr] bg-white/[0.04] text-sm text-slate-300">
            <div className="px-4 py-3 font-medium text-white">Feature</div>
            <div className="px-4 py-3 font-medium text-white">Free</div>
            <div className="px-4 py-3 font-medium text-white">Pro</div>
            <div className="px-4 py-3 font-medium text-white">Custom</div>
          </div>
          {[
            ['Analyses / month', freePlan.limits.monthlyAnalyses.toLocaleString(), proPlan.limits.monthlyAnalyses.toLocaleString(), 'Tailored'],
            ['API keys', String(freePlan.limits.apiKeys), String(proPlan.limits.apiKeys), 'Tailored'],
            ['Webhooks', String(freePlan.limits.webhooks), String(proPlan.limits.webhooks), 'Tailored'],
            ['Priority support', '—', 'Included', 'Priority + tailored'],
            ['Custom workflow requests', '—', 'Limited', 'Included']
          ].map((row, index) => (
            <div key={row[0]} className={`grid grid-cols-[1.2fr_0.9fr_0.9fr_0.9fr] text-sm ${index % 2 === 0 ? 'bg-slate-900/50' : 'bg-slate-950/70'}`}>
              {row.map((cell, cellIndex) => (
                <div key={cellIndex} className={`px-4 py-3 ${cellIndex === 0 ? 'text-white' : 'text-slate-300'}`}>{cell}</div>
              ))}
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-[2rem] border border-white/10 bg-white/[0.03] p-6 sm:p-8">
        <h2 className="text-2xl font-semibold text-white">Usage and limits</h2>
        <div className="mt-5 grid gap-4 sm:grid-cols-3">
          {usageItems.map((item) => (
            <div key={item.label} className="rounded-2xl border border-white/10 bg-slate-900/60 p-4">
              <p className="text-sm text-slate-400">{item.label}</p>
              <p className="mt-3 text-3xl font-semibold text-white">{item.current}/{item.limit}</p>
              <div className="mt-3 h-2 overflow-hidden rounded-full bg-white/10">
                <div className="h-full rounded-full bg-gradient-to-r from-sky-400 to-indigo-500" style={{ width: `${Math.min(100, (item.current / Math.max(1, item.limit)) * 100)}%` }} />
              </div>
            </div>
          ))}
        </div>
        {message ? <p className="mt-4 text-sm text-amber-300">{message}</p> : null}
      </div>
    </section>
  );
}
