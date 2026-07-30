import type { MetadataRoute } from 'next';
import { absoluteUrl, categoryCatalogPath, productPath, publicStaticRoutes } from '@/lib/seo';

const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL ?? 'http://localhost:3001';
export const revalidate = 3600;

type SitemapProduct = {
  id: number;
  slug?: string | null;
  createdAt?: string | null;
};

type SitemapCategory = {
  id: number;
  slug: string;
  productCount?: number;
};

async function fetchJson<T>(path: string, fallback: T): Promise<T> {
  try {
    const response = await fetch(`${backendUrl}${path}`, {
      next: { revalidate },
      signal: AbortSignal.timeout(20000),
    });

    if (!response.ok) return fallback;
    return (await response.json()) as T;
  } catch {
    return fallback;
  }
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [products, categories] = await Promise.all([
    fetchJson<SitemapProduct[]>('/products?view=lite', []),
    fetchJson<SitemapCategory[]>('/categories', []),
  ]);

  const now = new Date();
  const staticEntries = publicStaticRoutes.map((route) => ({
    url: absoluteUrl(route.path),
    lastModified: now,
    changeFrequency: route.changeFrequency,
    priority: route.priority,
  }));

  const categoryEntries = categories
    .filter((category) => category.slug && Number(category.productCount ?? 1) > 0)
    .map((category) => ({
      url: absoluteUrl(categoryCatalogPath(category)),
      lastModified: now,
      changeFrequency: 'weekly' as const,
      priority: 0.7,
    }));

  const productEntries = products.map((product) => ({
    url: absoluteUrl(productPath(product)),
    lastModified: product.createdAt ? new Date(product.createdAt) : now,
    changeFrequency: 'weekly' as const,
    priority: 0.8,
  }));

  return [...staticEntries, ...categoryEntries, ...productEntries];
}
