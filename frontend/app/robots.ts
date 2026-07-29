import type { MetadataRoute } from 'next';
import { siteUrl } from '@/lib/seo';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: [
        '/admin',
        '/admin/',
        '/autentificare',
        '/autentificare/',
        '/basket',
        '/checkout',
        '/checkout/',
        '/cont',
        '/cont/',
        '/favorites',
        '/catalog?*colors=',
        '/catalog?*sizes=',
        '/catalog?*sort=',
        '/catalog?*perPage=',
      ],
    },
    sitemap: `${siteUrl}/sitemap.xml`,
    host: siteUrl,
  };
}
