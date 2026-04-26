import Link from 'next/link';
import { Zap, ArrowRight } from 'lucide-react';

const FOOTER_LINKS: Record<string, { label: string; href: string }[]> = {
  Product: [
    { label: 'Analysis', href: '/analysis' },
    { label: 'Pricing', href: '/pricing' },
    { label: 'Solutions', href: '/solutions' },
    { label: 'Changelog', href: '/changelog' }
  ],
  Intelligence: [
    { label: 'Scam Playbooks', href: '/scams' },
    { label: 'Insights', href: '/insights' },
    { label: 'Public Reports', href: '/insights' },
    { label: 'Safety Reports', href: '/analysis' }
  ],
  Company: [
    { label: 'About', href: '/about' },
    { label: 'Contact', href: '/contact' },
    { label: 'Security', href: '/security' },
    { label: 'Privacy', href: '/privacy' }
  ]
};

export function SiteFooter() {
  return (
    <footer className="border-t border-white/[0.06] bg-[#0a0a0f]">
      {/* CTA Band */}
      <div className="border-b border-white/[0.06]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-12 flex flex-col sm:flex-row items-center justify-between gap-6">
          <div>
            <h3 className="text-white font-semibold text-lg mb-1">
              Ready to identify unknown callers?
            </h3>
            <p className="text-white/40 text-sm">Start free, no account needed.</p>
          </div>
          <Link
            href="/analysis"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-medium text-white bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 shadow-lg shadow-violet-500/20 transition-all duration-200 active:scale-[0.97] shrink-0"
          >
            Analyze now
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>

      {/* Main footer */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-14 grid grid-cols-2 md:grid-cols-5 gap-10">
        {/* Brand */}
        <div className="col-span-2 flex flex-col gap-4 max-w-xs">
          <Link href="/" className="flex items-center gap-2 w-fit">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-violet-500/25">
              <Zap className="w-4 h-4 text-white" strokeWidth={2.5} />
            </div>
            <span className="text-white font-semibold text-[15px]">FilterCalls</span>
          </Link>
          <p className="text-white/35 text-sm leading-relaxed">
            Privacy-first call intelligence OS for individuals, security teams, and developers.
          </p>
        </div>

        {/* Link columns */}
        {Object.entries(FOOTER_LINKS).map(([group, links]) => (
          <div key={group} className="flex flex-col gap-4">
            <p className="text-white/60 text-xs font-semibold uppercase tracking-widest">
              {group}
            </p>
            <ul className="flex flex-col gap-2.5">
              {links.map(({ label, href }) => (
                <li key={label}>
                  <Link
                    href={href}
                    className="text-white/40 hover:text-white/80 text-sm transition-colors"
                  >
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      {/* Bottom row */}
      <div className="border-t border-white/[0.05]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-5 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-white/25 text-xs">
            © 2026 FilterCalls. All rights reserved.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3 text-xs text-white/25">
            <span>Call Intelligence OS</span>
            <Link href="/privacy" className="hover:text-white/60">Privacy</Link>
            <Link href="/security" className="hover:text-white/60">Security</Link>
            <Link href="/contact" className="hover:text-white/60">Contact</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
