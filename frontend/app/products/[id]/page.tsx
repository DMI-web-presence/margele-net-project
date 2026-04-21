import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import ProductFavoriteIconButton from '@/components/product-favorite-icon-button';
import ProductImageMagnifier from '@/components/product-image-magnifier';
import { ProductReviewsProvider } from '@/components/product-reviews-provider';
import QuantitySelector from '@/components/quantity-selector';
import ReviewsSection from '@/components/reviews-section';
import ReviewsSummary from '@/components/reviews-summary';
import SimilarProductsSlider from '@/components/similar-products-slider';
import SizeSelector from '@/components/size-selector';

type Product = {
  id: number;
  name: string;
  description: string | null;
  tag?: string | null;
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
    return 'Necategorizat';
  }

  const category = categoryDefinitions[categoryId];
  if (!category) {
    return `Categoria ${categoryId}`;
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

async function getProducts(): Promise<Product[]> {
  const res = await fetch('http://127.0.0.1:3001/products', {
    cache: 'no-store',
  });

  if (!res.ok) {
    return [];
  }

  const text = await res.text();
  if (!text.trim()) {
    return [];
  }

  try {
    return JSON.parse(text) as Product[];
  } catch {
    return [];
  }
}

export default async function ProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const product = await getProduct(id);
  const allProducts = await getProducts();

  if (!product) {
    notFound();
  }

  const similarByCategory = allProducts.filter(
    (item) => item.id !== product.id && item.categoryId === product.categoryId,
  );
  const similarFallback = allProducts.filter((item) => item.id !== product.id);
  const similarProducts =
    (similarByCategory.length > 0 ? similarByCategory : similarFallback).slice(0, 9);

  return (
    <main className="px-6 py-8 sm:px-10 lg:px-54">
      <div className="mx-auto mb-8 flex w-full max-w-5xl flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm uppercase tracking-[0.3em] text-slate-500">Detalii produs</p>
          <h1 className="mt-4 text-4xl font-semibold tracking-tight text-slate-900 sm:text-5xl">
            {product.name}
          </h1>
        </div>
        <Link
          href="/"
          className="inline-flex items-center rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-900 transition hover:bg-slate-100"
        >
          Inapoi la catalog
        </Link>
      </div>

      <ProductReviewsProvider productId={product.id}>
      <div className="mx-auto w-full max-w-5xl space-y-6">
        <div className="grid gap-8 xl:grid-cols-[0.8fr_1.2fr]">
          <Card className="relative overflow-hidden bg-slate-950 text-white shadow-xl">
            {product.imageUrl ? (
              <div className="w-full h-full flex items-center justify-center">
                <ProductImageMagnifier
                  src={product.imageUrl}
                  alt={product.name}
                  width={800}
                  height={800}
                />
              </div>
            ) : (
              <div className="flex h-[12rem] items-center justify-center bg-slate-900 text-slate-300 sm:h-[14rem] lg:h-[16rem]">
                Imagine indisponibila
              </div>
            )}
          </Card>

          <Card className="space-y-6 p-8">
            <div className="space-y-3">
              <div className="flex flex-wrap items-center gap-1.5 text-[11px] uppercase tracking-[0.25em] text-slate-500">
                <span>{getCategoryLabel(product.categoryId)}</span>
                {Number(product.price) > 20 ? <Badge className="px-2 py-0.5 text-[10px]">Popular</Badge> : null}
              </div>
              <ReviewsSummary />
              <div className="space-y-2">
                <p className="text-3xl font-semibold tracking-tight text-slate-900">{product.name}</p>
                <p className="text-2xl font-semibold text-slate-900">{new Intl.NumberFormat('ro-RO', { style: 'currency', currency: 'RON', currencyDisplay: 'narrowSymbol' }).format(Number(product.price))}</p>
              </div>
              <div className="space-y-1 text-sm text-slate-700">
                <p>
                  <span className="font-semibold text-slate-900">Material:</span>{' '}
                  {product.description ?? 'Material premium'}
                  {product.tag ? (
                    <span className="ml-2 inline-flex items-center rounded-full bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-700">
                      {product.tag}
                    </span>
                  ) : null}
                </p>
                <p>
                  <span className="font-semibold text-slate-900">Disponibilitate:</span> In stoc
                </p>
                <p>
                  <span className="font-semibold text-slate-900">Cod produs:</span> MGL-{String(product.id).padStart(4, '0')}
                </p>
              </div>
              <SizeSelector sizes={['6.5 mm', '8.5 mm', '10.5 mm', '12.5 mm', '14.5 mm']} />
              <QuantitySelector />
            </div>

            <div className="flex items-center gap-2">
              <div className="flex items-center gap-2">
                <Button>Adauga in cos</Button>
                <ProductFavoriteIconButton
                  product={{
                    id: product.id,
                    name: product.name,
                    price: product.price,
                    imageUrl: product.imageUrl,
                  }}
                />
              </div>
            </div>
          </Card>
        </div>

        <ReviewsSection />
        <SimilarProductsSlider products={similarProducts} />
      </div>
      </ProductReviewsProvider>
    </main>
  );
}
