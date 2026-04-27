import Link from 'next/link';
import type { Metadata } from 'next';
import { SiteHeader } from '@/components/layout/site-header';
import { SiteFooter } from '@/components/layout/site-footer';
import { HomeHero } from '@/components/sections/home-hero';
import { FeatureGrid } from '@/components/sections/feature-grid';
import { HomeProductProof } from '@/components/sections/home-product-proof';
import { HomeBlocks } from '@/components/sections/home-blocks';
import { HomePricing } from '@/components/sections/home-pricing';
import { ScamPlaybooksShowcase } from '@/components/sections/scam-playbooks-showcase';

export const metadata: Metadata = {
  title: 'FilterCalls — Call Intelligence OS',
  description: 'Analyze unknown callers, detect spam and scam signals, and access community-driven phone reputation — privacy-first call intelligence.',
  alternates: { canonical: 'https://filtercalls.com' },
  openGraph: {
    title: 'FilterCalls — Call Intelligence OS',
    description: 'Analyze unknown callers, detect spam and scam signals, and access community-driven phone reputation — privacy-first call intelligence.',
    url: 'https://filtercalls.com',
    type: 'website',
    siteName: 'FilterCalls'
  }
};

export default function HomePage() {
  const organizationJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'FilterCalls',
    url: 'https://filtercalls.com'
  };

  const websiteJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'FilterCalls',
    url: 'https://filtercalls.com',
    potentialAction: {
      '@type': 'SearchAction',
      target: 'https://filtercalls.com/analysis?number={search_term_string}',
      'query-input': 'required name=search_term_string'
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0a0f]">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationJsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteJsonLd) }} />
      <SiteHeader />
      <main className="flex flex-col gap-0">
        <HomeHero />
        <section data-section="discovery" className="border-b border-white/10 bg-white/[0.03] px-4 py-10 sm:px-6">
          <div className="mx-auto max-w-6xl space-y-4">
            <h2 className="text-2xl font-semibold text-white">Choose your path</h2>
            <div className="grid gap-4 md:grid-cols-3">
              {[
                {
                  title: 'I received a suspicious call',
                  subtitle: 'Analyze the number — takes 10 seconds',
                  href: '/analysis',
                  tag: 'For individuals'
                },
                {
                  title: 'I want to understand scam patterns',
                  subtitle: 'Explore tactics used by scammers today',
                  href: '/scams',
                  tag: 'For everyone'
                },
                {
                  title: 'I want to integrate call protection',
                  subtitle: 'API-first, deterministic, no LLM dependency',
                  href: '/api-docs',
                  tag: 'For developers'
                }
              ].map((item) => (
                <Link key={item.title} href={item.href} className="group rounded-2xl border border-white/10 bg-white/[0.03] p-5 transition hover:-translate-y-0.5 hover:border-cyan-300/25 hover:bg-white/[0.06]">
                  <p className="text-xs uppercase tracking-[0.18em] text-cyan-100">{item.tag}</p>
                  <h3 className="mt-3 text-lg font-semibold text-white">{item.title}</h3>
                  <p className="mt-2 text-sm text-white/55">{item.subtitle}</p>
                  <p className="mt-4 text-sm font-semibold text-cyan-100 transition group-hover:translate-x-0.5">Continue →</p>
                </Link>
              ))}
            </div>
          </div>
        </section>
        <div className="border-y border-white/10 bg-white/[0.02] px-6 py-3 text-center">
          <Link href="/analysis" className="text-sm text-white/55 transition hover:text-violet-200">
            Seen a suspicious number? →
          </Link>
        </div>
        <HomeProductProof />
        <FeatureGrid />
        <HomeBlocks />
        <ScamPlaybooksShowcase />
        <HomePricing />
      </main>
      <SiteFooter />
    </div>
  );
}
