'use client';
export const runtime = 'edge';

import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { FormEvent, useState } from 'react';
import { AuthShell } from '@/components/portal/auth-shell';

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [unverifiedEmail, setUnverifiedEmail] = useState<string | null>(null);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    setError(null);
    setUnverifiedEmail(null);

    try {
      const response = await fetch('/api/portal/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier, password }),
      });

      const data = await response.json().catch(() => null);
      if (!response.ok) {
        const code = data?.error?.code;
        if (code === 'EMAIL_NOT_VERIFIED') {
          setUnverifiedEmail(data?.error?.email ?? null);
        }
        setError(data?.error?.message ?? 'Login failed. Please check your credentials.');
        return;
      }

      router.push('/portal/overview');
      router.refresh();
    } catch {
      setError('Unable to reach the portal right now. Please retry in a moment.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell
      eyebrow="Portal access"
      title="Sign in to your FilterCalls workspace"
      subtitle="Access your analytics, keys, billing, and webhook controls from one refined control center."
      footer={<div className="flex items-center justify-between gap-3"><span>Need an account?</span><Link href="/signup" className="font-medium text-sky-300 hover:text-sky-200">Create one now</Link></div>}
    >
      <div className="space-y-5">
        <div>
          <h2 className="text-3xl font-semibold text-white">Log in</h2>
          <p className="mt-2 text-sm leading-6 text-slate-300">Use your email or phone number, or continue with Google.</p>
        </div>

        {searchParams.get('created') === '1' ? <div className="rounded-2xl border border-emerald-400/25 bg-emerald-400/10 px-4 py-3 text-sm text-emerald-100">Account created. Check your inbox, verify your email, then sign in.</div> : null}
        {searchParams.get('verified') === '1' ? <div className="rounded-2xl border border-emerald-400/25 bg-emerald-400/10 px-4 py-3 text-sm text-emerald-100">Email verified successfully. You can sign in now.</div> : null}
        {searchParams.get('error') ? <div className="rounded-2xl border border-red-400/25 bg-red-400/10 px-4 py-3 text-sm text-red-100">We could not complete sign-in. Please try again.</div> : null}

        <a href="/api/portal/oauth/google?redirect_to=/portal/overview" className="flex w-full items-center justify-center gap-3 rounded-2xl border border-white/10 bg-white px-4 py-3 text-sm font-semibold text-slate-900 transition hover:bg-slate-100">
          <span>Continue with Google</span>
        </a>

        <div className="flex items-center gap-3 text-xs uppercase tracking-[0.24em] text-slate-500">
          <span className="h-px flex-1 bg-white/10" />
          <span>or</span>
          <span className="h-px flex-1 bg-white/10" />
        </div>

        <form className="space-y-4" onSubmit={handleSubmit}>
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-200">Email or phone</label>
            <input className="w-full rounded-2xl border border-white/10 bg-slate-800/90 px-4 py-3 text-white outline-none transition placeholder:text-slate-500 focus:border-sky-400/60" placeholder="you@example.com or +213..." value={identifier} onChange={(e) => setIdentifier(e.target.value)} autoComplete="username" required />
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between gap-3">
              <label className="text-sm font-medium text-slate-200">Password</label>
              <Link href="/forgot-password" className="text-xs font-medium text-sky-300 hover:text-sky-200">Forgot password?</Link>
            </div>
            <input className="w-full rounded-2xl border border-white/10 bg-slate-800/90 px-4 py-3 text-white outline-none transition placeholder:text-slate-500 focus:border-sky-400/60" placeholder="Enter your password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="current-password" required />
          </div>

          {error ? <p className="rounded-2xl border border-red-400/20 bg-red-400/10 px-4 py-3 text-sm text-red-100">{error}</p> : null}
          {unverifiedEmail ? (
            <Link href={`/verify-email?email=${encodeURIComponent(unverifiedEmail)}`} className="inline-flex w-full items-center justify-center rounded-2xl border border-sky-400/20 bg-sky-400/10 px-4 py-3 text-sm font-semibold text-sky-100 transition hover:bg-sky-400/15">
              Open verification status
            </Link>
          ) : null}

          <button className="inline-flex w-full items-center justify-center rounded-2xl bg-gradient-to-r from-sky-500 via-blue-500 to-indigo-500 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-blue-950/40 transition hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-70" disabled={loading}>
            {loading ? 'Signing you in...' : 'Log in'}
          </button>
        </form>
      </div>
    </AuthShell>
  );
}
