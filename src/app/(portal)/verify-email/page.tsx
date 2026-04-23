'use client';
export const runtime = 'edge';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { AuthShell } from '@/components/portal/auth-shell';

type Status = 'idle' | 'loading' | 'success' | 'error';
type ResendStatus = 'idle' | 'loading' | 'success' | 'error';

export default function VerifyEmailPage() {
  const searchParams = useSearchParams();
  const token = searchParams.get('token');
  const email = searchParams.get('email');
  const [status, setStatus] = useState<Status>(token ? 'loading' : 'idle');
  const [message, setMessage] = useState(
    token ? 'Verifying your email...' : 'Your verification email was sent successfully. Check your inbox and open the link to activate your account.'
  );
  const [resendStatus, setResendStatus] = useState<ResendStatus>('idle');
  const [resendMessage, setResendMessage] = useState<string | null>(null);

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

  const handleResend = async () => {
    if (!email || resendStatus === 'loading') return;
    setResendStatus('loading');
    setResendMessage(null);

    try {
      const response = await fetch('/api/portal/resend-verification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });
      const data = await response.json().catch(() => null);
      if (!response.ok) {
        setResendStatus('error');
        setResendMessage(data?.error?.message ?? 'We could not resend the verification email right now.');
        return;
      }

      setResendStatus('success');
      setResendMessage('A fresh verification email has been sent. Please check your inbox.');
    } catch {
      setResendStatus('error');
      setResendMessage('We could not resend the verification email right now.');
    }
  };

  const canResend = !!email && !token;

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

        {canResend ? (
          <div className="rounded-2xl border border-sky-400/20 bg-sky-400/10 px-4 py-4 text-sm text-sky-100">
            Didn&apos;t get the email? You can request a fresh verification link below.
          </div>
        ) : null}

        {resendMessage ? (
          <div className={`rounded-2xl px-4 py-3 text-sm ${resendStatus === 'error' ? 'border border-red-400/25 bg-red-400/10 text-red-100' : 'border border-emerald-400/25 bg-emerald-400/10 text-emerald-100'}`}>
            {resendMessage}
          </div>
        ) : null}

        {canResend ? (
          <button
            type="button"
            onClick={handleResend}
            className="inline-flex w-full items-center justify-center rounded-2xl border border-white/10 bg-slate-800 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-70"
            disabled={resendStatus === 'loading'}
          >
            {resendStatus === 'loading' ? 'Sending a new verification email...' : 'Resend verification email'}
          </button>
        ) : null}

        {status === 'success' ? (
          <Link href="/login?verified=1" className="inline-flex w-full items-center justify-center rounded-2xl bg-gradient-to-r from-sky-500 via-blue-500 to-indigo-500 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-blue-950/40 transition hover:opacity-95">
            Continue to login
          </Link>
        ) : null}
        {status === 'error' ? (
          <Link href={email ? `/verify-email?email=${encodeURIComponent(email)}` : '/signup'} className="inline-flex w-full items-center justify-center rounded-2xl border border-white/10 bg-slate-800 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-700">
            {email ? 'Return to verification status' : 'Create a fresh account'}
          </Link>
        ) : null}
      </div>
    </AuthShell>
  );
}
