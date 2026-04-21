import ProductsPage from '@/components/products-page';

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
  const res = await fetch('http://127.0.0.1:3001/products', {
    cache: 'no-store',
  });

  if (!res.ok) {
    throw new Error('Failed to load products');
  }

  const text = await res.text();
  if (!text.trim()) {
    throw new Error('Failed to load products');
  }

  return JSON.parse(text) as Product[];
}

export default async function Home() {
  const products = await getProducts();

  return (
    <main className="px-10 py-8 sm:px-20 lg:px-32">
      <ProductsPage products={products} />
    </main>
  );
}
