import Link from 'next/link';
import { SiteHeader } from '@/components/layout/site-header';
import { SiteFooter } from '@/components/layout/site-footer';
import { HomeHero } from '@/components/sections/home-hero';
import { FeatureGrid } from '@/components/sections/feature-grid';
import { HomeBlocks } from '@/components/sections/home-blocks';
import { HomePricing } from '@/components/sections/home-pricing';

export default function HomePage() {
  return (
    <div className="min-h-screen bg-[#0a0a0f]">
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
        <HomePricing />
      </main>
      <SiteFooter />
    </div>
  );
}
