import Link from 'next/link';
import { Zap, ArrowRight } from 'lucide-react';
import { getFooterRoutes } from '@/lib/navigation/product-routes';

const footerRouteMap = new Map(getFooterRoutes().map((route) => [route.href, route]));

const FOOTER_GROUPS: Record<string, Array<{ label: string; href: string }>> = {
  Product: [
    { label: 'Analyze Number', href: '/analysis' },
    { label: 'AI Call Decision', href: '/analysis#ai-decision' },
    { label: 'Scam Intelligence', href: '/scams' }
  ],
  Developers: [
    { label: 'API Reference', href: '/api-docs' },
    { label: 'Quickstart', href: '/api-docs#quickstart' },
    { label: 'Webhooks', href: '/api-docs#webhooks' }
  ],
  Solutions: [
    { label: 'Fraud Prevention', href: '/solutions' },
    { label: 'Support Teams', href: '/solutions' },
    { label: 'Call Centers', href: '/solutions' },
    { label: 'Contact Sales', href: '/contact' }
  ],
  Resources: [
    { label: 'Scam Playbooks', href: '/scams' },
    { label: 'Changelog', href: '/changelog' },
    { label: 'Insights', href: '/insights' }
  ],
  Company: [
    { label: 'About', href: '/about' },
    { label: 'Security', href: '/security' },
    { label: 'Contact', href: '/contact' }
  ]
};

const isExistingRoute = (href: string) => {
  if (href.startsWith('/api-docs#')) return footerRouteMap.has('/api-docs');
  if (href.startsWith('/analysis#')) return footerRouteMap.has('/analysis');
  return footerRouteMap.has(href);
};

export function SiteFooter() {
  return (
    <footer className="border-t border-white/[0.06] bg-[#0a0a0f]">
      <div className="border-b border-white/[0.06]">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-6 px-4 py-12 sm:flex-row sm:px-6">
          <div>
            <h3 className="mb-1 text-lg font-semibold text-white">Ready to identify unknown callers?</h3>
            <p className="text-sm text-white/40">Start free, no account needed.</p>
          </div>
          <Link
            href="/analysis"
            className="inline-flex shrink-0 items-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 px-6 py-3 text-sm font-medium text-white shadow-lg shadow-violet-500/20 transition-all duration-200 active:scale-[0.97] hover:from-violet-500 hover:to-indigo-500"
          >
            Analyze now
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>

      <div className="mx-auto grid max-w-6xl grid-cols-2 gap-10 px-4 py-14 sm:px-6 md:grid-cols-7">
        <div className="col-span-2 flex max-w-xs flex-col gap-4">
          <Link href="/" className="flex w-fit items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-violet-500 to-indigo-600 shadow-lg shadow-violet-500/25">
              <Zap className="h-4 w-4 text-white" strokeWidth={2.5} />
            </div>
            <span className="text-[15px] font-semibold text-white">FilterCalls</span>
          </Link>
          <p className="text-sm leading-relaxed text-white/35">Privacy-first call intelligence OS for individuals, security teams, and developers.</p>
          <p className="text-xs font-medium uppercase tracking-[0.18em] text-cyan-200/80">Don&apos;t block. Know first.</p>
        </div>

        {Object.entries(FOOTER_GROUPS).map(([group, links]) => (
          <div key={group} className="col-span-1 flex flex-col gap-4">
            <p className="text-xs font-semibold uppercase tracking-widest text-white/60">{group}</p>
            <ul className="flex flex-col gap-2.5">
              {links
                .filter((link) => isExistingRoute(link.href))
                .map(({ label, href }) => (
                  <li key={`${group}-${label}`}>
                    <Link href={href} className="text-sm text-white/40 transition-colors hover:text-white/80">
                      {label}
                    </Link>
                  </li>
                ))}
            </ul>
          </div>
        ))}
      </div>

      <div className="border-t border-white/[0.05]">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-3 px-4 py-5 sm:flex-row sm:px-6">
          <p className="text-xs text-white/25">© 2026 FilterCalls. All rights reserved.</p>
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
