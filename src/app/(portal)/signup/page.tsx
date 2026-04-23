'use client';
export const runtime = 'edge';

import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { FormEvent, useMemo, useState } from 'react';
import { AuthShell } from '@/components/portal/auth-shell';

export default function SignupPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [form, setForm] = useState({
    fullName: '',
    email: '',
    confirmEmail: '',
    phone: '',
    password: '',
    confirmPassword: '',
  });
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const nextPath = useMemo(() => {
    const next = searchParams.get('next');
    return next && next.startsWith('/') ? next : '/portal/overview';
  }, [searchParams]);

  const updateField = (field: keyof typeof form, value: string) => setForm((current) => ({ ...current, [field]: value }));

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);

    if (form.email.trim().toLowerCase() !== form.confirmEmail.trim().toLowerCase()) {
      setError('Emails do not match.');
      return;
    }
    if (form.password !== form.confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/portal/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await response.json().catch(() => null);
      if (!response.ok) {
        setError(data?.error?.message ?? 'Unable to create your account right now.');
        return;
      }

      router.push(`/verify-email?email=${encodeURIComponent(form.email)}${nextPath !== '/portal/overview' ? `&next=${encodeURIComponent(nextPath)}` : ''}`);
    } catch {
      setError('Unable to reach the portal right now. Please retry in a moment.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell
      eyebrow="New workspace"
      title="Create a polished FilterCalls portal account"
      subtitle="Set up your secure account, verify your email, and unlock API management with a smoother onboarding flow."
      footer={<div className="flex items-center justify-between gap-3"><span>Already have an account?</span><Link href={`/login${nextPath !== '/portal/overview' ? `?next=${encodeURIComponent(nextPath)}` : ''}`} className="font-medium text-sky-300 hover:text-sky-200">Log in</Link></div>}
    >
      <div className="space-y-5">
        <div>
          <h2 className="text-3xl font-semibold text-white">Create account</h2>
          <p className="mt-2 text-sm leading-6 text-slate-300">Use Google for instant access, or fill in your details to create a verified account.</p>
        </div>

        <a href={`/api/portal/oauth/google?redirect_to=${encodeURIComponent(nextPath)}`} className="flex w-full items-center justify-center gap-3 rounded-2xl border border-white/10 bg-white px-4 py-3 text-sm font-semibold text-slate-900 transition hover:bg-slate-100">
          <span>Sign up with Google</span>
        </a>

        <div className="flex items-center gap-3 text-xs uppercase tracking-[0.24em] text-slate-500">
          <span className="h-px flex-1 bg-white/10" />
          <span>or</span>
          <span className="h-px flex-1 bg-white/10" />
        </div>

        <form className="space-y-4" onSubmit={handleSubmit}>
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-200">Full name</label>
            <input className="w-full rounded-2xl border border-white/10 bg-slate-800/90 px-4 py-3 text-white outline-none transition placeholder:text-slate-500 focus:border-sky-400/60" placeholder="Your full name" value={form.fullName} onChange={(e) => updateField('fullName', e.target.value)} required />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-200">Email</label>
              <input className="w-full rounded-2xl border border-white/10 bg-slate-800/90 px-4 py-3 text-white outline-none transition placeholder:text-slate-500 focus:border-sky-400/60" placeholder="you@example.com" type="email" value={form.email} onChange={(e) => updateField('email', e.target.value)} autoComplete="email" required />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-200">Confirm email</label>
              <input className="w-full rounded-2xl border border-white/10 bg-slate-800/90 px-4 py-3 text-white outline-none transition placeholder:text-slate-500 focus:border-sky-400/60" placeholder="Repeat your email" type="email" value={form.confirmEmail} onChange={(e) => updateField('confirmEmail', e.target.value)} autoComplete="email" required />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-200">Phone number</label>
            <input className="w-full rounded-2xl border border-white/10 bg-slate-800/90 px-4 py-3 text-white outline-none transition placeholder:text-slate-500 focus:border-sky-400/60" placeholder="+213 5..." value={form.phone} onChange={(e) => updateField('phone', e.target.value)} autoComplete="tel" required />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-200">Password</label>
              <input className="w-full rounded-2xl border border-white/10 bg-slate-800/90 px-4 py-3 text-white outline-none transition placeholder:text-slate-500 focus:border-sky-400/60" placeholder="Minimum 10 chars" type="password" value={form.password} onChange={(e) => updateField('password', e.target.value)} autoComplete="new-password" required />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-200">Confirm password</label>
              <input className="w-full rounded-2xl border border-white/10 bg-slate-800/90 px-4 py-3 text-white outline-none transition placeholder:text-slate-500 focus:border-sky-400/60" placeholder="Repeat password" type="password" value={form.confirmPassword} onChange={(e) => updateField('confirmPassword', e.target.value)} autoComplete="new-password" required />
            </div>
          </div>

          <p className="text-xs leading-6 text-slate-400">Passwords must be at least 10 characters and include letters and numbers.</p>
          {error ? <p className="rounded-2xl border border-red-400/20 bg-red-400/10 px-4 py-3 text-sm text-red-100">{error}</p> : null}

          <button className="inline-flex w-full items-center justify-center rounded-2xl bg-gradient-to-r from-sky-500 via-blue-500 to-indigo-500 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-blue-950/40 transition hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-70" disabled={loading}>
            {loading ? 'Creating your account...' : 'Create account'}
          </button>
        </form>
      </div>
    </AuthShell>
  );
}
