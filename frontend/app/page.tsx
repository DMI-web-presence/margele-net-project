import LandingPage from '@/components/landing-page';
import { mockProducts } from '@/lib/mock-products';

const backendUrl =
  process.env.NEXT_PUBLIC_BACKEND_URL ?? 'http://localhost:3001';

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
    const res = await fetch(`${backendUrl}/products`, {
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

export default async function Home() {
  const products = await getProducts();

  return (
    <main>
      <LandingPage products={products.length > 0 ? products : mockProducts} />
    </main>
  );
}
