import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/dashboard/', '/api/'], // Protect dashboard and API routes from crawling
    },
    sitemap: 'https://kasicourier.com/sitemap.xml',
  };
}
