import type { MetadataRoute } from 'next';
import { getD1 } from '@/lib/db/d1';
import { getRecentPublicReports } from '@/lib/reputation/store';
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
    { url: `${base}/insights`, priority: 0.8 },
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

  const db = getD1();
  if (!db) return staticPages;

  try {
    const reports = await getRecentPublicReports(db, 200);
    const dynamicPages: MetadataRoute.Sitemap = reports.map((item) => ({
      url: `${base}/report/${item.hash}`,
      lastModified: new Date(item.last_reported_at),
      changeFrequency: 'weekly',
      priority: 0.6
    }));

    return [...staticPages, ...dynamicPages];
  } catch {
    return staticPages;
  }
}
