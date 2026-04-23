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
        <FeatureGrid />
        <HomeBlocks />
        <HomePricing />
      </main>
      <SiteFooter />
    </div>
  );
}
