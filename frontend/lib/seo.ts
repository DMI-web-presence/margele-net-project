import type { Metadata } from 'next';
import { toPlainText } from '@/lib/plain-text';

export const siteUrl = normalizeSiteUrl(process.env.NEXT_PUBLIC_SITE_URL || 'https://www.margele.net');
export const siteName = 'Margele.net';
export const defaultSeoTitle = 'Margele.net - margele, accesorii si materiale handmade';
export const defaultSeoDescription =
  'Magazin online cu margele, accesorii pentru bijuterii, materiale handmade, decoratiuni si unelte creative livrate in Romania.';

export const publicStaticRoutes = [
  { path: '/', priority: 1, changeFrequency: 'daily' as const },
  { path: '/catalog', priority: 0.9, changeFrequency: 'daily' as const },
  { path: '/catalog-digital', priority: 0.7, changeFrequency: 'weekly' as const },
  { path: '/noutati', priority: 0.7, changeFrequency: 'daily' as const },
  { path: '/cum-cumpar', priority: 0.5, changeFrequency: 'monthly' as const },
  { path: '/transport', priority: 0.5, changeFrequency: 'monthly' as const },
  { path: '/retur-produse', priority: 0.4, changeFrequency: 'monthly' as const },
  { path: '/despre-noi', priority: 0.4, changeFrequency: 'monthly' as const },
  { path: '/contact', priority: 0.4, changeFrequency: 'monthly' as const },
  { path: '/gdpr', priority: 0.2, changeFrequency: 'yearly' as const },
];

export const privateRouteRobots: Metadata['robots'] = {
  index: false,
  follow: false,
  googleBot: {
    index: false,
    follow: false,
  },
};

export function absoluteUrl(path: string) {
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  return `${siteUrl}${cleanPath}`;
}

export function productPath(product: { id: number; slug?: string | null }) {
  return `/products/${encodeURIComponent(product.slug || String(product.id))}`;
}

export function categoryCatalogPath(category: { slug: string }) {
  return `/categorii/${encodeURIComponent(category.slug)}`;
}

export function seoDescription(value: string | null | undefined, fallback = defaultSeoDescription) {
  const plain = toPlainText(value).replace(/\s+/g, ' ').trim() || fallback;
  return plain.length > 158 ? `${plain.slice(0, 155).replace(/\s+\S*$/, '')}...` : plain;
}

export function buildPageMetadata({
  title,
  description,
  path,
  image,
  noindex = false,
}: {
  title: string;
  description: string;
  path: string;
  image?: string | null;
  noindex?: boolean;
}): Metadata {
  const url = absoluteUrl(path);
  const images = image ? [{ url: image, alt: title }] : [{ url: absoluteUrl('/favicon.png'), alt: siteName }];

  return {
    title,
    description,
    alternates: {
      canonical: url,
    },
    openGraph: {
      type: 'website',
      siteName,
      title,
      description,
      url,
      locale: 'ro_RO',
      images,
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: images.map((item) => item.url),
    },
    robots: noindex ? privateRouteRobots : undefined,
  };
}

function normalizeSiteUrl(value: string) {
  const trimmed = String(value || '').trim().replace(/\/+$/, '');
  return trimmed || 'https://www.margele.net';
}
