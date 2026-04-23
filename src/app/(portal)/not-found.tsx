export default function PortalNotFound() {
  return (
    <div className="portal-page-shell mx-auto max-w-3xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="rounded-[2rem] border border-white/10 bg-white/[0.03] p-8 text-white shadow-2xl shadow-black/20">
        <p className="text-xs font-medium uppercase tracking-[0.24em] text-slate-400">Portal</p>
        <h1 className="mt-3 text-3xl font-semibold">This workspace page could not be found</h1>
        <p className="mt-3 text-sm leading-7 text-slate-300">The page may have moved, or the link is no longer valid. Return to the portal overview to continue.</p>
        <div className="mt-6">
          <a href="/portal/overview" className="rounded-2xl bg-gradient-to-r from-sky-500 via-blue-500 to-indigo-500 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-blue-950/35">Go to overview</a>
        </div>
      </div>
    </div>
  );
}
