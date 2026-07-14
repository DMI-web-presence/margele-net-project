import { Suspense } from 'react';
import ProductsPage from '@/components/products-page';
import { mockProducts } from '@/lib/mock-products';

export const dynamic = 'force-dynamic';

type Product = {
  id: number;
  name: string;
  description: string | null;
  price: string;
  imageUrl: string | null;
  categoryId: number | null;
  categories?: Category[];
  createdAt: string;
};

type Category = {
  id: number;
  parentId: number | null;
  name: string;
  slug: string;
  productCount?: number;
};

async function getProducts(): Promise<Product[]> {
  try {
    const res = await fetch('http://127.0.0.1:3001/products', {
      cache: 'no-store',
      signal: AbortSignal.timeout(5000),
    });

    if (!res.ok) {
      return [];
    }

    const text = await res.text();
    if (!text.trim()) {
      return [];
    }

    return JSON.parse(text) as Product[];
  } catch (error) {
    console.error('Failed to fetch products:', error);
    return [];
  }
}

async function getCategories(): Promise<Category[]> {
  try {
    const res = await fetch('http://127.0.0.1:3001/categories', {
      cache: 'no-store',
      signal: AbortSignal.timeout(5000),
    });

    if (!res.ok) {
      return [];
    }

    const text = await res.text();
    if (!text.trim()) {
      return [];
    }

    return JSON.parse(text) as Category[];
  } catch (error) {
    console.error('Failed to fetch categories:', error);
    return [];
  }
}

export default async function CatalogPage() {
  const [products, categories] = await Promise.all([getProducts(), getCategories()]);

  return (
    <main className="px-10 py-8 sm:px-20 lg:px-32">
      <Suspense fallback={<div className="py-12 text-sm font-semibold text-slate-500">Se incarca produsele...</div>}>
        <ProductsPage products={products.length > 0 ? products : mockProducts} categories={categories} />
      </Suspense>
    </main>
  );
}
