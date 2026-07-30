import LandingPage from '@/components/landing-page';
import { buildPageMetadata, defaultSeoDescription, defaultSeoTitle } from '@/lib/seo';

const backendUrl =
  process.env.NEXT_PUBLIC_BACKEND_URL ?? 'http://localhost:3001';
const homepageRevalidateSeconds = 300;
export const revalidate = 300;

export const metadata = buildPageMetadata({
  title: defaultSeoTitle,
  description: defaultSeoDescription,
  path: '/',
});

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
    const res = await fetch(`${backendUrl}/products?view=lite`, {
      next: { revalidate: homepageRevalidateSeconds },
      signal: AbortSignal.timeout(20000),
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
      <LandingPage products={products} />
    </main>
  );
}
