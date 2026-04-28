import type { MetadataRoute } from 'next';
import { scamPatterns } from '@/lib/scams/patterns';

const base = 'https://filtercalls.com';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const scamPages: MetadataRoute.Sitemap = scamPatterns.map((pattern) => ({
    url: `${base}/scams/${pattern.slug}`,
    changeFrequency: 'monthly',
    priority: 0.7
  }));

  const staticPages: MetadataRoute.Sitemap = [
    { url: `${base}/`, priority: 1.0 },
    { url: `${base}/analysis`, priority: 0.9 },
    { url: `${base}/api-docs`, changeFrequency: 'monthly', priority: 0.8 },
    { url: `${base}/features`, changeFrequency: 'monthly', priority: 0.7 },
    { url: `${base}/insights`, priority: 0.8 },
    { url: `${base}/report`, changeFrequency: 'weekly', priority: 0.5 },
    { url: `${base}/scams`, changeFrequency: 'monthly', priority: 0.8 },
    { url: `${base}/about`, priority: 0.7 },
    { url: `${base}/pricing`, priority: 0.7 },
    { url: `${base}/solutions`, priority: 0.6 },
    { url: `${base}/changelog`, priority: 0.6 },
    { url: `${base}/security`, priority: 0.6 },
    { url: `${base}/contact`, priority: 0.5 },
    { url: `${base}/privacy`, priority: 0.5 },
    ...scamPages
  ];
  return staticPages;
}
