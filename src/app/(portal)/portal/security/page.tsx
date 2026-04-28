'use client';
export const runtime = 'edge';

import Link from 'next/link';
import { useEffect, useState } from 'react';

type PortalSecurityProfile = {
  email: string;
  email_verified_at: number | null;
  auth_provider?: string | null;
  last_login_at?: number | null;
};

const formatDate = (value?: number | null) => {
  if (!value) return '—';
  const date = new Date(value * 1000);
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleString();
};

export default function PortalSecurityPage() {
  const [profile, setProfile] = useState<PortalSecurityProfile | null>(null);
  const [state, setState] = useState<'loading' | 'error' | 'ready'>('loading');

  useEffect(() => {
    let cancelled = false;

    fetch('/api/portal/me', { cache: 'no-store' })
      .then(async (response) => {
        if (!response.ok) throw new Error('failed');
        const payload = (await response.json()) as PortalSecurityProfile;
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
    return <section className="space-y-4"><h1 className="text-3xl font-semibold">Security</h1><p className="text-slate-300">Loading security details…</p></section>;
  }

  if (state === 'error' || !profile) {
    return <section className="space-y-4"><h1 className="text-3xl font-semibold">Security</h1><p className="text-slate-300">Unable to load security details right now.</p></section>;
  }

  return (
    <section className="space-y-8">
      <div className="rounded-[2rem] border border-white/10 bg-white/[0.03] p-6 sm:p-8">
        <p className="text-xs font-medium uppercase tracking-[0.24em] text-slate-400">Security</p>
        <h1 className="mt-2 text-3xl font-semibold text-white">Account security foundation</h1>
        <p className="mt-2 text-sm text-slate-300">Current authentication status and next-step hardening controls.</p>

        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          <div className="rounded-2xl border border-white/10 bg-slate-900/60 p-4">
            <p className="text-xs font-medium uppercase tracking-[0.24em] text-slate-400">Email verification</p>
            <p className="mt-2 text-base font-medium text-white">{profile.email_verified_at ? 'Verified' : 'Pending verification'}</p>
            <p className="mt-1 text-sm text-slate-400">{profile.email}</p>
          </div>

          <div className="rounded-2xl border border-white/10 bg-slate-900/60 p-4">
            <p className="text-xs font-medium uppercase tracking-[0.24em] text-slate-400">Password status</p>
            <p className="mt-2 text-base font-medium text-white">Protected by {profile.auth_provider || 'password'} auth</p>
            <p className="mt-1 text-sm text-slate-400">Last login: {formatDate(profile.last_login_at)}</p>
          </div>
        </div>
      </div>

      <div className="rounded-[2rem] border border-white/10 bg-white/[0.03] p-6 sm:p-8">
        <p className="text-xs font-medium uppercase tracking-[0.24em] text-slate-400">Security checklist</p>
        <div className="mt-4 space-y-3">
          <div className="rounded-2xl border border-white/10 bg-slate-900/60 p-4">
            <p className="text-sm font-medium text-white">Change password</p>
            <p className="mt-1 text-sm text-slate-400">Use reset flow if you suspect credential reuse.</p>
            <Link href="/forgot-password" className="mt-3 inline-flex text-sm font-medium text-sky-300 hover:text-sky-200">Change password →</Link>
          </div>
          <div className="rounded-2xl border border-white/10 bg-slate-900/60 p-4">
            <p className="text-sm font-medium text-white">Phone verification</p>
            <p className="mt-1 text-sm text-slate-400">Coming soon</p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-slate-900/60 p-4">
            <p className="text-sm font-medium text-white">Two-factor authentication (2FA)</p>
            <p className="mt-1 text-sm text-slate-400">Coming soon</p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-slate-900/60 p-4">
            <p className="text-sm font-medium text-white">Active sessions</p>
            <p className="mt-1 text-sm text-slate-400">Coming soon</p>
          </div>
        </div>
      </div>
    </section>
  );
}
