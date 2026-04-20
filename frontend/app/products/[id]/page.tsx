import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

type Product = {
  id: number;
  name: string;
  description: string | null;
  price: string;
  imageUrl: string | null;
  categoryId: number | null;
  createdAt: string;
};

const categoryDefinitions: Record<number, { label: string; parentId?: string }> = {
  1: { label: 'Craciun', parentId: 'event' },
  2: { label: 'pandandive' },
};

const parentCategoryLabels: Record<string, string> = {
  event: 'Articole pentru evenimente',
};

const getCategoryLabel = (categoryId: number | null) => {
  if (!categoryId) {
    return 'Uncategorized';
  }

  const category = categoryDefinitions[categoryId];
  if (!category) {
    return `Category ${categoryId}`;
  }

  if (category.parentId) {
    return `${parentCategoryLabels[category.parentId]} / ${category.label}`;
  }

  return category.label;
};

async function getProduct(id: string): Promise<Product | null> {
  const res = await fetch(`http://127.0.0.1:3001/products/${id}`, {
    cache: 'no-store',
  });

  if (!res.ok) {
    return null;
  }

  const text = await res.text();
  if (!text.trim()) {
    return null;
  }

  try {
    const data = JSON.parse(text);
    return data as Product;
  } catch {
    return null;
  }
}

export default async function ProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const product = await getProduct(id);

  if (!product) {
    notFound();
  }

  return (
    <main className="px-6 py-8 sm:px-10 lg:px-16">
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm uppercase tracking-[0.3em] text-slate-500">Product Details</p>
          <h1 className="mt-4 text-4xl font-semibold tracking-tight text-slate-900 sm:text-5xl">
            {product.name}
          </h1>
        </div>
        <Link
          href="/"
          className="inline-flex items-center rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-900 transition hover:bg-slate-100"
        >
          Back to catalog
        </Link>
      </div>

      <div className="grid gap-8 xl:grid-cols-[1.2fr_0.8fr]">
        <Card className="overflow-hidden bg-slate-950 text-white shadow-xl">
          {product.imageUrl ? (
            <div className="relative h-[32rem] w-full">
              <Image
                src={product.imageUrl}
                alt={product.name}
                fill
                className="object-cover"
                unoptimized
              />
            </div>
          ) : (
            <div className="flex h-[32rem] items-center justify-center bg-slate-900 text-slate-300">
              No image available
            </div>
          )}
        </Card>

        <div className="space-y-6">
          <Card className="space-y-6 p-8">
            <div className="space-y-3">
              <div className="flex flex-wrap items-center gap-3">
                <Badge>{getCategoryLabel(product.categoryId)}</Badge>
                <Badge className="bg-indigo-100 text-indigo-700">Limited Release</Badge>
              </div>
              <div className="space-y-2">
                <p className="text-3xl font-semibold tracking-tight text-slate-900">{product.name}</p>
                <p className="text-2xl font-semibold text-slate-900">{new Intl.NumberFormat('ro-RO', { style: 'currency', currency: 'RON', currencyDisplay: 'narrowSymbol' }).format(Number(product.price))}</p>
              </div>
              <p className="text-sm leading-7 text-slate-600">{product.description ?? 'A detailed product description will help your customers feel confident and excited.'}</p>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <Button className="w-full sm:w-auto">Add to Bag</Button>
              <Link href="#details" className="inline-flex items-center rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-900 transition hover:bg-slate-100">
                Request Private Consultation
              </Link>
            </div>
          </Card>

          <Card className="p-8">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-slate-900">The Story</h2>
                <span className="text-sm uppercase tracking-[0.3em] text-slate-500">New</span>
              </div>
              <p className="text-sm leading-7 text-slate-600">
                {product.description ?? 'Born from the finest craftsmanship, this product is designed to bring beauty and utility together in a luxurious package.'}
              </p>
            </div>

            <div id="details" className="mt-8 grid gap-4 sm:grid-cols-2">
              <div className="rounded-3xl bg-slate-50 p-5">
                <p className="text-sm uppercase tracking-[0.3em] text-slate-500">Dimensions</p>
                <p className="mt-3 text-base font-semibold text-slate-900">24 × 18 × 12 cm</p>
              </div>
              <div className="rounded-3xl bg-slate-50 p-5">
                <p className="text-sm uppercase tracking-[0.3em] text-slate-500">Weight</p>
                <p className="mt-3 text-base font-semibold text-slate-900">1.2 kg</p>
              </div>
              <div className="rounded-3xl bg-slate-50 p-5">
                <p className="text-sm uppercase tracking-[0.3em] text-slate-500">Material</p>
                <p className="mt-3 text-base font-semibold text-slate-900">Obsidian Clay, Gold Leaf</p>
              </div>
              <div className="rounded-3xl bg-slate-50 p-5">
                <p className="text-sm uppercase tracking-[0.3em] text-slate-500">Care</p>
                <p className="mt-3 text-base font-semibold text-slate-900">Dry Cloth Only</p>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </main>
  );
}
