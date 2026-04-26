import Link from 'next/link';
import type { Metadata } from 'next';
import { SiteHeader } from '@/components/layout/site-header';
import { SiteFooter } from '@/components/layout/site-footer';
import { HomeHero } from '@/components/sections/home-hero';
import { FeatureGrid } from '@/components/sections/feature-grid';
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
        <div className="border-y border-white/10 bg-white/[0.02] px-6 py-3 text-center">
          <Link href="/analysis" className="text-sm text-white/55 transition hover:text-violet-200">
            Seen a suspicious number? →
          </Link>
        </div>
        <FeatureGrid />
        <HomeBlocks />
        <ScamPlaybooksShowcase />
        <HomePricing />
      </main>
      <SiteFooter />
    </div>
  );
}
