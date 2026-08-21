import BasketPageContent from '@/components/basket-page-content';
import { buildPageMetadata } from '@/lib/seo';

export const metadata = buildPageMetadata({
  title: 'Cos de cumparaturi',
  description: 'Cosul tau de cumparaturi Margele.net.',
  path: '/basket',
  noindex: true,
});

type Product = {
  id: number;
  name: string;
  description: string | null;
  price: string;
  imageUrl: string | null;
  sku?: string | null;
  searchTokens?: string[];
  categoryId: number | null;
  createdAt: string;
};

async function getProducts(): Promise<Product[]> {
  const backendUrl =
    process.env.NEXT_PUBLIC_BACKEND_URL ?? 'http://127.0.0.1:3001';

  const response = await fetch(`${backendUrl}/products?view=lite`, {
    cache: 'no-store',
  }).catch(() => null);

  if (!response?.ok) {
    return [];
  }

  const text = await response.text();
  if (!text.trim()) {
    return [];
  }

  return JSON.parse(text) as Product[];
}

export default async function BasketPage() {
  const products = await getProducts();

  return <BasketPageContent products={products} />;
}
