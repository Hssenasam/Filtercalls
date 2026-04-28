import Link from 'next/link';

export default function NotFound() {
  return (
    <section className="mx-auto max-w-3xl space-y-8 py-10">
      <div className="space-y-4">
        <p className="inline-flex rounded-full border border-violet-400/20 bg-violet-400/10 px-3 py-1 text-xs font-medium uppercase tracking-[0.2em] text-violet-200">404</p>
        <h1 className="text-4xl font-semibold tracking-tight text-white md:text-5xl">Page not found.</h1>
        <p className="text-lg text-white/60">This page may have moved, or the link may be incomplete.</p>
      </div>

      <div className="flex flex-wrap gap-3">
        <Link href="/analysis" className="inline-flex items-center justify-center rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 px-4 py-2 text-sm font-medium text-white">Analyze a number</Link>
        <Link href="/" className="inline-flex items-center justify-center rounded-xl border border-white/10 bg-white/[0.04] px-4 py-2 text-sm font-medium text-white/80 hover:bg-white/[0.08]">Go home</Link>
      </div>

      <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
        <p className="text-sm font-medium text-white">Helpful links</p>
        <div className="mt-3 grid gap-2 sm:grid-cols-2">
          <Link href="/scams" className="text-sm text-white/70 hover:text-white">Scam Intelligence</Link>
          <Link href="/features" className="text-sm text-white/70 hover:text-white">Features</Link>
          <Link href="/pricing" className="text-sm text-white/70 hover:text-white">Pricing</Link>
          <Link href="/security" className="text-sm text-white/70 hover:text-white">Security</Link>
          <Link href="/api-docs" className="text-sm text-white/70 hover:text-white">API Docs</Link>
          <Link href="/contact" className="text-sm text-white/70 hover:text-white">Contact</Link>
        </div>
      </div>
    </section>
  );
}
