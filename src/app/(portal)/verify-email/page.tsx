'use client';
export const runtime = 'edge';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { AuthShell } from '@/components/portal/auth-shell';

type Status = 'idle' | 'loading' | 'success' | 'error';

export default function VerifyEmailPage() {
  const searchParams = useSearchParams();
  const token = searchParams.get('token');
  const email = searchParams.get('email');
  const [status, setStatus] = useState<Status>(token ? 'loading' : 'idle');
  const [message, setMessage] = useState(token ? 'Verifying your email...' : 'We sent a verification link to your inbox.');

  useEffect(() => {
    if (!token) return;
    let cancelled = false;

    const run = async () => {
      try {
        const response = await fetch(`/api/portal/verify-email?token=${encodeURIComponent(token)}`, { cache: 'no-store' });
        const data = await response.json().catch(() => null);
        if (cancelled) return;
        if (!response.ok) {
          setStatus('error');
          setMessage(data?.error?.message ?? 'This verification link is invalid or expired.');
          return;
        }
        setStatus('success');
        setMessage('Email verified successfully. You can sign in now.');
      } catch {
        if (!cancelled) {
          setStatus('error');
          setMessage('We could not verify your email right now. Please try again later.');
        }
      }
    };

    void run();
    return () => {
      cancelled = true;
    };
  }, [token]);

  return (
    <AuthShell
      eyebrow="Email verification"
      title="Complete your secure access setup"
      subtitle="A quick verification keeps account ownership clean before you access the portal."
      footer={<div className="flex items-center justify-between gap-3"><span>Already verified?</span><Link href="/login" className="font-medium text-sky-300 hover:text-sky-200">Go to login</Link></div>}
    >
      <div className="space-y-5">
        <div>
          <h2 className="text-3xl font-semibold text-white">Verify your email</h2>
          <p className="mt-2 text-sm leading-6 text-slate-300">{email ? `We created your account for ${email}.` : 'Finish verification to unlock password sign-in.'}</p>
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-sm leading-6 text-slate-200">
          {message}
        </div>

        {status === 'idle' ? (
          <div className="rounded-2xl border border-sky-400/20 bg-sky-400/10 px-4 py-3 text-sm text-sky-100">
            Open the link from your inbox. Once verified, return here and sign in.
          </div>
        ) : null}
        {status === 'success' ? (
          <Link href="/login?verified=1" className="inline-flex w-full items-center justify-center rounded-2xl bg-gradient-to-r from-sky-500 via-blue-500 to-indigo-500 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-blue-950/40 transition hover:opacity-95">
            Continue to login
          </Link>
        ) : null}
        {status === 'error' ? (
          <Link href="/signup" className="inline-flex w-full items-center justify-center rounded-2xl border border-white/10 bg-slate-800 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-700">
            Create a fresh account
          </Link>
        ) : null}
      </div>
    </AuthShell>
  );
}
