import type { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: ['/', '/report/', '/insights', '/analysis'],
        disallow: ['/portal/', '/api/', '/login', '/signup', '/forgot-password', '/reset-password', '/verify-email']
      }
    ],
    sitemap: 'https://filtercalls.com/sitemap.xml'
  };
}
