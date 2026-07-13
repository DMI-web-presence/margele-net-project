import ProductsPage from '@/components/products-page';
import { mockProducts } from '@/lib/mock-products';

type Product = {
  id: number;
  name: string;
  description: string | null;
  price: string;
  imageUrl: string | null;
  categoryId: number | null;
  createdAt: string;
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

export default async function CatalogPage() {
  const products = await getProducts();

  return (
    <main className="px-10 py-8 sm:px-20 lg:px-32">
      <ProductsPage products={products.length > 0 ? products : mockProducts} />
    </main>
  );
}
