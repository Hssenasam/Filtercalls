import Link from 'next/link';

export const SiteFooter = () => (
  <footer className="mt-24 border-t border-white/10">
    <div className="mx-auto grid max-w-6xl gap-8 px-4 py-12 md:grid-cols-4">
      <div className="md:col-span-2">
        <p className="text-lg font-semibold">FilterCalls — Call Intent Intelligence Platform</p>
        <p className="mt-2 max-w-md text-sm text-muted">
          Reduce call noise with confidence. Analyze probable intent, operational risk, and real-world response guidance before you answer.
        </p>
      </div>
      <div>
        <p className="text-sm font-medium">Product</p>
        <ul className="mt-2 space-y-2 text-sm text-muted">
          <li><Link href="/analysis">Number Analysis</Link></li>
          <li><Link href="/api-docs">API</Link></li>
          <li><Link href="/solutions">Solutions</Link></li>
        </ul>
      </div>
      <div>
        <p className="text-sm font-medium">Company</p>
        <ul className="mt-2 space-y-2 text-sm text-muted">
          <li><Link href="/about">About</Link></li>
          <li><Link href="/contact">Contact</Link></li>
          <li><Link href="/insights">Insights</Link></li>
        </ul>
      </div>
    </div>
  </footer>
);
