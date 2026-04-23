import type { MetadataRoute } from 'next';

export default function sitemap(): MetadataRoute.Sitemap {
  const base = 'https://filtercalls.com';

  return [
    { url: `${base}/`, priority: 1 },
    { url: `${base}/analysis`, priority: 0.9 },
    { url: `${base}/pricing`, priority: 0.8 },
    { url: `${base}/about`, priority: 0.6 },
    { url: `${base}/contact`, priority: 0.6 },
    { url: `${base}/solutions`, priority: 0.6 },
    { url: `${base}/api-docs`, priority: 0.5 }
  ];
}