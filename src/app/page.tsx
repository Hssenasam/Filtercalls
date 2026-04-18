import { FeatureGrid } from '@/components/sections/feature-grid';
import { HomeBlocks } from '@/components/sections/home-blocks';
import { HomeHero } from '@/components/sections/home-hero';

export default function HomePage() {
  return (
    <div>
      <HomeHero />
      <FeatureGrid />
      <HomeBlocks />
    </div>
  );
}
