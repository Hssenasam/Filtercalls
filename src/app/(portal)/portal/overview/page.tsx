'use client';
export const runtime = 'edge';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';

type DashboardWindow = { label: string; total: number; highRiskPct: number; averageRisk: number };
type DashboardRecent = { id: string; masked_number: string; country: string; risk_score: number; risk_level: string; created_at: number };
type DashboardCountry = { country: string; count: number };

type DashboardMetrics = {
  windows: DashboardWindow[];
  topCountries: DashboardCountry[];
  recent: DashboardRecent[];
};

type Profile = {
  id: string;
  email: string;
  email_verified_at: number | null;
  full_name?: string | null;
  auth_provider?: string | null;
  billing_status?: string;
  last_login_at?: number | null;
  resources?: { api_keys: number; webhooks: number };
  plan?: {
    id: string;
    label: string;
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

const prettifyLabel = (label: string) => {
  if (label === 'last_24h') return 'Last 24 hours';
  if (label === 'last_7d') return 'Last 7 days';
  if (label === 'last_30d') return 'Last 30 days';
  return label;
};

export default function PortalOverview() {
  const [state, setState] = useState<'loading' | 'error' | 'ready'>('loading');
  const [dashboard, setDashboard] = useState<DashboardMetrics | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const router = useRouter();

  useEffect(() => {
    let cancelled = false;

    Promise.all([
      fetch('/api/portal/dashboard', { cache: 'no-store' }),
      fetch('/api/portal/me', { cache: 'no-store' })
    ])
      .then(async ([dashboardRes, meRes]) => {
        if (dashboardRes.status === 401 || meRes.status === 401) {
          router.replace('/login?next=/portal/overview');
          return;
        }
        if (!dashboardRes.ok || !meRes.ok) throw new Error('Failed to load portal overview');
        const [dashboardPayload, mePayload] = await Promise.all([dashboardRes.json(), meRes.json()]);
        if (!cancelled) {
          setDashboard(dashboardPayload as DashboardMetrics);
          setProfile(mePayload as Profile);
          setState('ready');
        }
      })
      .catch(() => {
        if (!cancelled) setState('error');
      });

    return () => {
      cancelled = true;
    };
  }, [router]);

  const todayWindow = useMemo(() => dashboard?.windows.find((window) => window.label === 'last_24h') ?? dashboard?.windows[0], [dashboard]);
  const monthWindow = useMemo(() => dashboard?.windows.find((window) => window.label === 'last_30d') ?? dashboard?.windows[dashboard.windows.length - 1], [dashboard]);
  const hasActivity = (dashboard?.recent.length ?? 0) > 0;
  const onboardingItems = useMemo(() => {
    if (!profile) return [];
    return [
      { label: 'Verify email', done: !!profile.email_verified_at, href: '/verify-email' },
      { label: 'Create your first API key', done: (profile.resources?.api_keys ?? 0) > 0, href: '/portal/keys' },
      { label: 'Run your first live analysis', done: (profile.plan?.usage.analyses_used ?? 0) > 0, href: '/analysis' },
      { label: 'Attach a webhook', done: (profile.resources?.webhooks ?? 0) > 0, href: '/portal/webhooks' }
    ];
  }, [profile]);
  const onboardingDone = onboardingItems.filter((item) => item.done).length;

  if (state === 'loading') {
    return <section className="space-y-4"><h1 className="text-3xl font-semibold">Portal overview</h1><p className="text-slate-300">Loading your command center…</p></section>;
  }
  if (state === 'error' || !dashboard || !profile) {
    return <section className="space-y-4"><h1 className="text-3xl font-semibold">Portal overview</h1><p className="text-slate-300">Unable to load overview data right now.</p></section>;
  }

  return (
    <section className="space-y-8">
      <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <div className="rounded-[2rem] border border-white/10 bg-gradient-to-br from-slate-900 to-slate-950 p-6 shadow-2xl shadow-sky-950/15 sm:p-8">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
            <div className="space-y-3">
              <p className="text-xs font-medium uppercase tracking-[0.24em] text-sky-300/80">Welcome back</p>
              <h1 className="text-3xl font-semibold text-white sm:text-4xl">{profile.full_name || 'Your FilterCalls workspace'}</h1>
              <p className="max-w-2xl text-sm leading-7 text-slate-300 sm:text-base">Control API access, monitor detection volume, and move from setup to live call intelligence from one focused portal.</p>
              <div className="flex flex-wrap items-center gap-3 pt-2 text-sm text-slate-300">
                <span className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5">Plan: {profile.plan?.label || 'Free'}</span>
                <span className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5">{profile.email_verified_at ? 'Email verified' : 'Verification pending'}</span>
                <span className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5">{profile.plan?.usage.analyses_remaining ?? 0} analyses remaining</span>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-3 lg:w-[360px] lg:grid-cols-1">
              <Link href="/analysis" className="rounded-2xl bg-gradient-to-r from-sky-500 via-blue-500 to-indigo-500 px-4 py-3 text-center text-sm font-semibold text-white shadow-lg shadow-blue-950/35 transition hover:opacity-95">Run first analysis</Link>
              <Link href="/portal/keys" className="rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-center text-sm font-medium text-white transition hover:bg-white/[0.08]">Create API key</Link>
              <Link href="/portal/billing" className="rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-center text-sm font-medium text-white transition hover:bg-white/[0.08]">Upgrade plan</Link>
            </div>
          </div>
        </div>

        <div className="rounded-[2rem] border border-white/10 bg-white/[0.03] p-6 sm:p-8">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs font-medium uppercase tracking-[0.24em] text-slate-400">Onboarding</p>
              <h2 className="mt-2 text-2xl font-semibold text-white">Get started faster</h2>
              <p className="mt-2 text-sm text-slate-300">Finish the core setup steps to unlock a complete developer-ready workspace.</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/[0.05] px-3 py-2 text-right">
              <p className="text-xs text-slate-400">Progress</p>
              <p className="text-lg font-semibold text-white">{onboardingDone}/{onboardingItems.length}</p>
            </div>
          </div>
          <div className="mt-5 space-y-3">
            {onboardingItems.map((item) => (
              <Link key={item.label} href={item.href} className="flex items-center justify-between gap-3 rounded-2xl border border-white/10 bg-slate-900/60 px-4 py-3 transition hover:bg-white/[0.05]">
                <div className="flex items-center gap-3">
                  <span className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-semibold ${item.done ? 'bg-emerald-400/15 text-emerald-300' : 'bg-white/[0.08] text-slate-300'}`}>{item.done ? '✓' : '•'}</span>
                  <span className="text-sm text-white">{item.label}</span>
                </div>
                <span className="text-xs text-slate-400">{item.done ? 'Done' : 'Open'}</span>
              </Link>
            ))}
          </div>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[
          { title: 'Requests today', value: todayWindow?.total ?? 0, hint: `${todayWindow?.highRiskPct ?? 0}% high-risk`, tone: 'from-sky-500/20 to-transparent' },
          { title: 'Requests this month', value: profile.plan?.usage.analyses_used ?? 0, hint: `${profile.plan?.usage.analyses_remaining ?? 0} remaining`, tone: 'from-indigo-500/20 to-transparent' },
          { title: 'Active API keys', value: profile.resources?.api_keys ?? 0, hint: `Limit ${profile.plan?.limits.apiKeys ?? 0}`, tone: 'from-violet-500/20 to-transparent' },
          { title: 'Webhook endpoints', value: profile.resources?.webhooks ?? 0, hint: `Limit ${profile.plan?.limits.webhooks ?? 0}`, tone: 'from-emerald-500/20 to-transparent' }
        ].map((card) => (
          <div key={card.title} className="overflow-hidden rounded-[1.75rem] border border-white/10 bg-white/[0.03]">
            <div className={`h-1 bg-gradient-to-r ${card.tone}`} />
            <div className="p-5">
              <p className="text-sm text-slate-400">{card.title}</p>
              <p className="mt-3 text-4xl font-semibold text-white">{card.value}</p>
              <p className="mt-2 text-sm text-slate-300">{card.hint}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <div className="space-y-6 rounded-[2rem] border border-white/10 bg-white/[0.03] p-6 sm:p-8">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-xs font-medium uppercase tracking-[0.24em] text-slate-400">Usage analytics</p>
              <h2 className="mt-2 text-2xl font-semibold text-white">Performance snapshot</h2>
            </div>
            <Link href="/portal/usage" className="text-sm font-medium text-sky-300 hover:text-sky-200">Open usage</Link>
          </div>

          <div className="grid gap-4 lg:grid-cols-3">
            {dashboard.windows.map((window) => (
              <div key={window.label} className="rounded-2xl border border-white/10 bg-slate-900/60 p-4">
                <p className="text-xs uppercase tracking-[0.2em] text-slate-500">{prettifyLabel(window.label)}</p>
                <p className="mt-3 text-3xl font-semibold text-white">{window.total}</p>
                <p className="mt-2 text-sm text-slate-300">{window.highRiskPct}% high-risk • Avg risk {window.averageRisk}</p>
              </div>
            ))}
          </div>

          <div className="rounded-3xl border border-white/10 bg-slate-900/60 p-5">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-medium text-white">Country demand</p>
                <p className="text-sm text-slate-400">Where your most recent analysis traffic is coming from.</p>
              </div>
            </div>
            {dashboard.topCountries.length ? (
              <div className="mt-5 space-y-4">
                {dashboard.topCountries.map((country) => {
                  const max = dashboard.topCountries[0]?.count || 1;
                  const width = Math.max(12, (country.count / max) * 100);
                  return (
                    <div key={country.country} className="space-y-2">
                      <div className="flex items-center justify-between text-sm text-slate-300">
                        <span>{country.country}</span>
                        <span>{country.count}</span>
                      </div>
                      <div className="h-2 rounded-full bg-white/10">
                        <div className="h-full rounded-full bg-gradient-to-r from-sky-400 to-indigo-500" style={{ width: `${width}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="mt-5 rounded-2xl border border-dashed border-white/10 bg-white/[0.02] p-5 text-sm text-slate-400">No usage yet. Your request geography will appear here after your first analyses.</div>
            )}
          </div>
        </div>

        <div className="space-y-6">
          <div className="rounded-[2rem] border border-white/10 bg-white/[0.03] p-6 sm:p-8">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-xs font-medium uppercase tracking-[0.24em] text-slate-400">Quick actions</p>
                <h2 className="mt-2 text-2xl font-semibold text-white">Move the account forward</h2>
              </div>
            </div>
            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              {[
                { label: 'Create API key', href: '/portal/keys', desc: 'Generate secure credentials for your integration.' },
                { label: 'Add webhook', href: '/portal/webhooks', desc: 'Push detections to your workflow automatically.' },
                { label: 'View docs', href: '/portal/docs', desc: 'Open the implementation guide and examples.' },
                { label: 'Billing & limits', href: '/portal/billing', desc: 'See quota, pricing, and upgrade options.' }
              ].map((action) => (
                <Link key={action.label} href={action.href} className="rounded-2xl border border-white/10 bg-slate-900/60 p-4 transition hover:bg-white/[0.05]">
                  <p className="text-base font-medium text-white">{action.label}</p>
                  <p className="mt-2 text-sm leading-6 text-slate-400">{action.desc}</p>
                </Link>
              ))}
            </div>
          </div>

          <div className="rounded-[2rem] border border-white/10 bg-white/[0.03] p-6 sm:p-8">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-xs font-medium uppercase tracking-[0.24em] text-slate-400">Recent activity</p>
                <h2 className="mt-2 text-2xl font-semibold text-white">Latest analysis events</h2>
              </div>
              <Link href="/analysis" className="text-sm font-medium text-sky-300 hover:text-sky-200">Run analysis</Link>
            </div>
            {hasActivity ? (
              <div className="mt-5 space-y-3">
                {dashboard.recent.slice(0, 5).map((item) => (
                  <div key={item.id} className="rounded-2xl border border-white/10 bg-slate-900/60 p-4">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="font-medium text-white">{item.masked_number}</p>
                        <p className="mt-1 text-sm text-slate-400">{item.country} • {item.risk_level}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-semibold text-white">{item.risk_score}</p>
                        <p className="text-xs text-slate-500">{formatDate(item.created_at)}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="mt-5 rounded-3xl border border-dashed border-white/10 bg-slate-900/50 p-6 text-center">
                <p className="text-lg font-medium text-white">No activity yet</p>
                <p className="mt-2 text-sm leading-6 text-slate-400">Your latest analyses, webhook triggers, and request history will appear here once you send your first request.</p>
                <Link href="/analysis" className="mt-4 inline-flex rounded-2xl bg-gradient-to-r from-sky-500 via-blue-500 to-indigo-500 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-blue-950/35">Run your first analysis</Link>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
        <div className="rounded-[2rem] border border-white/10 bg-white/[0.03] p-6 sm:p-8">
          <p className="text-xs font-medium uppercase tracking-[0.24em] text-slate-400">Account snapshot</p>
          <h2 className="mt-2 text-2xl font-semibold text-white">Identity, security, and quota</h2>
          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            <div className="rounded-2xl border border-white/10 bg-slate-900/60 p-4">
              <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Provider</p>
              <p className="mt-2 text-base font-medium text-white">{profile.auth_provider || 'password'}</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-slate-900/60 p-4">
              <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Last login</p>
              <p className="mt-2 text-base font-medium text-white">{formatDate(profile.last_login_at ? profile.last_login_at * 1000 : null)}</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-slate-900/60 p-4">
              <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Email status</p>
              <p className="mt-2 text-base font-medium text-white">{profile.email_verified_at ? 'Verified' : 'Pending verification'}</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-slate-900/60 p-4">
              <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Quota remaining</p>
              <p className="mt-2 text-base font-medium text-white">{profile.plan?.usage.analyses_remaining ?? 0} / {profile.plan?.limits.monthlyAnalyses ?? 0}</p>
            </div>
          </div>
        </div>

        <div className="rounded-[2rem] border border-white/10 bg-gradient-to-br from-slate-900 to-slate-950 p-6 sm:p-8">
          <p className="text-xs font-medium uppercase tracking-[0.24em] text-slate-400">Developer starter</p>
          <h2 className="mt-2 text-2xl font-semibold text-white">Launch faster with the right starting points</h2>
          <div className="mt-5 space-y-4">
            <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
              <p className="text-xs uppercase tracking-[0.2em] text-slate-500">API base</p>
              <p className="mt-2 font-mono text-sm text-sky-200">https://filtercalls.com/api/analyze</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
              <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Suggested next move</p>
              <p className="mt-2 text-sm leading-6 text-slate-300">Create an API key, send a first request, and then attach a webhook so detections stream into your own workflow.</p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Link href="/portal/docs" className="rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm font-medium text-white transition hover:bg-white/[0.08]">Open docs</Link>
              <Link href="/portal/keys" className="rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm font-medium text-white transition hover:bg-white/[0.08]">Generate key</Link>
              <Link href="/analysis" className="rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm font-medium text-white transition hover:bg-white/[0.08]">Test analysis</Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
