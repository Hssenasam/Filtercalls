'use client';
export const runtime = 'edge';

import { useEffect, useState } from 'react';

type PortalProfile = {
  id: string;
  email: string;
  email_verified_at: number | null;
  full_name?: string | null;
  phone?: string | null;
  auth_provider?: string | null;
  last_login_at?: number | null;
  account_created_at?: number | null;
  billing_status?: string;
  plan?: {
    id: string;
    label: string;
    monthly_price_usd: number;
    limits: { monthlyAnalyses: number; apiKeys: number; webhooks: number };
    usage: { analyses_used: number; analyses_remaining: number };
  };
};

const formatDate = (value?: number | null) => {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleString();
};

export default function PortalSettingsPage() {
  const [profile, setProfile] = useState<PortalProfile | null>(null);
  const [state, setState] = useState<'loading' | 'error' | 'ready'>('loading');

  useEffect(() => {
    let cancelled = false;
    fetch('/api/portal/me', { cache: 'no-store' })
      .then(async (response) => {
        if (!response.ok) throw new Error('failed');
        const payload = (await response.json()) as PortalProfile;
        if (!cancelled) {
          setProfile(payload);
          setState('ready');
        }
      })
      .catch(() => {
        if (!cancelled) setState('error');
      });

    return () => {
      cancelled = true;
    };
  }, []);

  if (state === 'loading') return <section className="space-y-4"><h1 className="text-3xl font-semibold">Account</h1><p className="text-slate-300">Loading account profile…</p></section>;
  if (state === 'error' || !profile) return <section className="space-y-4"><h1 className="text-3xl font-semibold">Account</h1><p className="text-slate-300">Unable to load your account right now.</p></section>;

  return (
    <section className="space-y-8">
      <div className="space-y-3">
        <p className="text-xs font-medium uppercase tracking-[0.24em] text-sky-300/80">Account center</p>
        <h1 className="text-3xl font-semibold">Profile & usage</h1>
        <p className="max-w-2xl text-slate-300">Your trial and portal access are locked behind login. This profile shows your account identity, verification status, plan, and how many analyses remain this month.</p>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
        <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-6 space-y-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="text-2xl font-semibold text-white">{profile.full_name || 'Portal user'}</h2>
              <p className="mt-1 text-sm text-slate-400">{profile.email}</p>
            </div>
            <div className="rounded-full border border-white/10 bg-white/[0.05] px-3 py-1 text-xs text-slate-300">{profile.plan?.label || 'Free'} plan</div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-2xl border border-white/10 bg-slate-900/60 p-4">
              <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Verification</p>
              <p className="mt-2 text-base font-medium text-white">{profile.email_verified_at ? 'Verified email' : 'Verification pending'}</p>
              <p className="mt-1 text-sm text-slate-400">{profile.email_verified_at ? `Verified on ${formatDate(profile.email_verified_at * 1000)}` : 'You must verify your email before password-based access is fully trusted.'}</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-slate-900/60 p-4">
              <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Provider</p>
              <p className="mt-2 text-base font-medium text-white">{profile.auth_provider || 'password'}</p>
              <p className="mt-1 text-sm text-slate-400">Last login: {formatDate(profile.last_login_at ? profile.last_login_at * 1000 : null)}</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-slate-900/60 p-4">
              <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Phone</p>
              <p className="mt-2 text-base font-medium text-white">{profile.phone || 'Not set yet'}</p>
              <p className="mt-1 text-sm text-slate-400">Used as an alternate login identifier when available.</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-slate-900/60 p-4">
              <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Created</p>
              <p className="mt-2 text-base font-medium text-white">{formatDate(profile.account_created_at)}</p>
              <p className="mt-1 text-sm text-slate-400">Billing status: {profile.billing_status || 'free'}</p>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="rounded-3xl border border-white/10 bg-gradient-to-br from-sky-500/15 to-indigo-500/10 p-6">
            <p className="text-xs uppercase tracking-[0.2em] text-sky-200/80">Remaining analyses</p>
            <p className="mt-3 text-5xl font-semibold text-white">{profile.plan?.usage.analyses_remaining ?? 0}</p>
            <p className="mt-2 text-sm text-slate-300">You have used {profile.plan?.usage.analyses_used ?? 0} of {profile.plan?.limits.monthlyAnalyses ?? 0} included analyses this month.</p>
            <div className="mt-4 h-3 overflow-hidden rounded-full bg-white/10">
              <div className="h-full rounded-full bg-gradient-to-r from-sky-400 to-indigo-500" style={{ width: `${Math.min(100, ((profile.plan?.usage.analyses_used ?? 0) / Math.max(1, profile.plan?.limits.monthlyAnalyses ?? 1)) * 100)}%` }} />
            </div>
          </div>

          <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-6 space-y-4">
            <h2 className="text-xl font-semibold text-white">Access policy</h2>
            <ul className="space-y-3 text-sm text-slate-300">
              <li>• Visitors must sign in before they can run live analysis.</li>
              <li>• Signed-in users can analyze numbers until their monthly limit is reached.</li>
              <li>• API keys and webhooks are also constrained by the active plan.</li>
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}
