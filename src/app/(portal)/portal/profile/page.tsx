'use client';
export const runtime = 'edge';

import Link from 'next/link';
import { useEffect, useState } from 'react';

type PortalProfile = {
  id: string;
  email: string;
  email_verified_at: number | null;
  full_name?: string | null;
  auth_provider?: string | null;
  account_created_at?: number | null;
  plan?: {
    id: string;
    label: string;
    limits: { monthlyAnalyses: number };
    usage: { analyses_used: number; analyses_remaining: number };
  };
};

const formatDate = (value?: number | null) => {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleString();
};

const initialsFromProfile = (profile: PortalProfile | null) => {
  const source = profile?.full_name?.trim() || profile?.email || 'FC';
  const parts = source.split(/\s+/).filter(Boolean);
  if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  return source.slice(0, 2).toUpperCase();
};

export default function PortalProfilePage() {
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

  if (state === 'loading') {
    return <section className="space-y-4"><h1 className="text-3xl font-semibold">Profile</h1><p className="text-slate-300">Loading your account profile…</p></section>;
  }

  if (state === 'error' || !profile) {
    return <section className="space-y-4"><h1 className="text-3xl font-semibold">Profile</h1><p className="text-slate-300">Unable to load your profile right now.</p></section>;
  }

  return (
    <section className="space-y-8">
      <div className="rounded-[2rem] border border-white/10 bg-white/[0.03] p-6 sm:p-8">
        <p className="text-xs font-medium uppercase tracking-[0.24em] text-slate-400">Profile</p>
        <h1 className="mt-2 text-3xl font-semibold text-white">Account identity</h1>
        <p className="mt-2 text-sm text-slate-300">Read-only profile details for your current workspace account.</p>

        <div className="mt-6 grid gap-4 lg:grid-cols-[0.8fr_1.2fr]">
          <div className="rounded-2xl border border-white/10 bg-slate-900/60 p-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-violet-500 to-indigo-600 text-lg font-semibold text-white">
              {initialsFromProfile(profile)}
            </div>
            <p className="mt-4 text-lg font-semibold text-white">{profile.full_name || 'My account'}</p>
            <p className="mt-1 text-sm text-slate-300 break-all">{profile.email}</p>
            <p className="mt-3 inline-flex rounded-full border border-white/10 bg-white/[0.05] px-3 py-1 text-xs text-white/70">{profile.plan?.label || 'Free'} plan</p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-2xl border border-white/10 bg-slate-900/60 p-4">
              <p className="text-xs font-medium uppercase tracking-[0.24em] text-slate-400">Full name</p>
              <p className="mt-2 text-base font-medium text-white">{profile.full_name || 'Not set'}</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-slate-900/60 p-4">
              <p className="text-xs font-medium uppercase tracking-[0.24em] text-slate-400">Email status</p>
              <p className="mt-2 text-base font-medium text-white">{profile.email_verified_at ? 'Verified' : 'Pending verification'}</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-slate-900/60 p-4">
              <p className="text-xs font-medium uppercase tracking-[0.24em] text-slate-400">Account created</p>
              <p className="mt-2 text-base font-medium text-white">{formatDate(profile.account_created_at)}</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-slate-900/60 p-4">
              <p className="text-xs font-medium uppercase tracking-[0.24em] text-slate-400">Auth provider</p>
              <p className="mt-2 text-base font-medium text-white">{profile.auth_provider || 'password'}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="rounded-[2rem] border border-white/10 bg-white/[0.03] p-6 sm:p-8">
        <p className="text-xs font-medium uppercase tracking-[0.24em] text-slate-400">Quick actions</p>
        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          <Link href="/analysis" className="rounded-2xl border border-white/10 bg-slate-900/60 p-4 text-center text-sm font-medium text-white hover:bg-white/[0.06]">Analyze a number</Link>
          <Link href="/portal/keys" className="rounded-2xl border border-white/10 bg-slate-900/60 p-4 text-center text-sm font-medium text-white hover:bg-white/[0.06]">View API keys</Link>
          <Link href="/portal/billing" className="rounded-2xl border border-white/10 bg-slate-900/60 p-4 text-center text-sm font-medium text-white hover:bg-white/[0.06]">Manage billing</Link>
        </div>
      </div>
    </section>
  );
}
