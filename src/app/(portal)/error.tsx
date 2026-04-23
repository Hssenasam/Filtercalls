'use client';

export default function PortalError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div className="portal-page-shell mx-auto max-w-3xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="rounded-[2rem] border border-white/10 bg-white/[0.03] p-8 text-white shadow-2xl shadow-black/20">
        <p className="text-xs font-medium uppercase tracking-[0.24em] text-amber-300/80">Portal error</p>
        <h1 className="mt-3 text-3xl font-semibold">Something went wrong in your workspace</h1>
        <p className="mt-3 text-sm leading-7 text-slate-300">The portal hit an unexpected issue while loading this page. Your account is still safe. Try again or return to the overview.</p>
        <div className="mt-6 flex flex-wrap gap-3">
          <button onClick={() => reset()} className="rounded-2xl bg-gradient-to-r from-sky-500 via-blue-500 to-indigo-500 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-blue-950/35">Try again</button>
          <a href="/portal/overview" className="rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm font-medium text-white">Back to overview</a>
        </div>
      </div>
    </div>
  );
}
