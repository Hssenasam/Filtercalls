import Link from 'next/link';
import type { ReactNode } from 'react';

export function AuthShell({
  eyebrow,
  title,
  subtitle,
  children,
  footer,
}: {
  eyebrow: string;
  title: string;
  subtitle: string;
  children: ReactNode;
  footer?: ReactNode;
}) {
  return (
    <div className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-slate-950/80 shadow-2xl shadow-blue-950/20 backdrop-blur">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(99,102,241,0.22),transparent_35%),radial-gradient(circle_at_bottom_right,rgba(14,165,233,0.16),transparent_30%)]" />
      <div className="relative grid lg:min-h-[720px] lg:grid-cols-[1.1fr_0.9fr]">
        <section className="order-2 flex flex-col justify-between border-t border-white/10 p-6 sm:p-8 lg:order-1 lg:border-r lg:border-t-0 lg:p-12">
          <div>
            <Link href="/" className="inline-flex items-center gap-3 text-sm font-semibold text-white">
              <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-500 via-indigo-500 to-sky-500 text-lg shadow-lg shadow-indigo-900/50">⚡</span>
              <span>FilterCalls</span>
            </Link>
            <div className="mt-6 max-w-xl space-y-4 sm:mt-8 sm:space-y-5">
              <span className="inline-flex rounded-full border border-sky-400/20 bg-sky-400/10 px-3 py-1 text-[11px] font-medium uppercase tracking-[0.24em] text-sky-200">
                {eyebrow}
              </span>
              <h1 className="text-3xl font-semibold leading-tight text-white sm:text-4xl lg:text-5xl">{title}</h1>
              <p className="max-w-lg text-sm leading-7 text-slate-300 sm:text-base lg:text-lg">{subtitle}</p>
            </div>
          </div>

          <div className="mt-8 grid gap-4 sm:grid-cols-3 lg:mt-12">
            {[
              ['Secure sessions', 'JWT + CSRF protection built for Cloudflare runtime.'],
              ['Faster onboarding', 'Email, phone, and Google sign-in in one polished flow.'],
              ['Production ready', 'Clear errors, loading states, and verification checkpoints.'],
            ].map(([heading, copy]) => (
              <div key={heading} className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <h2 className="text-sm font-semibold text-white">{heading}</h2>
                <p className="mt-2 text-sm leading-6 text-slate-300">{copy}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="order-1 flex items-start justify-center p-4 pt-5 sm:p-6 lg:order-2 lg:items-center lg:p-10">
          <div className="w-full max-w-md rounded-[1.75rem] border border-white/10 bg-slate-900/85 p-5 shadow-2xl shadow-slate-950/40 sm:p-7 lg:p-8">
            {children}
            {footer ? <div className="mt-6 border-t border-white/10 pt-5 text-sm text-slate-300">{footer}</div> : null}
          </div>
        </section>
      </div>
    </div>
  );
}
