import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import CatalogPageContent from '@/components/catalog-page-content';
import { buildPageMetadata, categoryCatalogPath, siteName } from '@/lib/seo';

export const dynamic = 'force-dynamic';

const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL ?? 'http://127.0.0.1:3001';

type Product = {
  id: number;
  name: string;
  description: string | null;
  price: string;
  imageUrl: string | null;
  categoryId: number | null;
  categories?: Category[];
  attributes?: Array<{ key: string; value: string }>;
  options?: Array<{ name: string; values: string[] }>;
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
    const response = await fetch(`${backendUrl}/products?view=lite`, {
      cache: 'no-store',
      signal: AbortSignal.timeout(5000),
    });

    if (!response.ok) return [];
    return (await response.json()) as Product[];
  } catch {
    return [];
  }
}

async function getCategories(): Promise<Category[]> {
  try {
    const response = await fetch(`${backendUrl}/categories`, {
      cache: 'no-store',
      signal: AbortSignal.timeout(5000),
    });

    if (!response.ok) return [];
    return (await response.json()) as Category[];
  } catch {
    return [];
  }
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const categories = await getCategories();
  const category = categories.find((item) => item.slug === slug);

  if (!category) {
    return buildPageMetadata({
      title: 'Categorie indisponibila',
      description: 'Categoria cautata nu este disponibila momentan pe Margele.net.',
      path: `/categorii/${encodeURIComponent(slug)}`,
      noindex: true,
    });
  }

  return buildPageMetadata({
    title: `${category.name} - produse handmade`,
    description: `Descopera produse din categoria ${category.name} pe ${siteName}: margele, accesorii si materiale creative pentru proiecte handmade.`,
    path: categoryCatalogPath(category),
  });
}

export default async function CategoryPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const [products, categories] = await Promise.all([getProducts(), getCategories()]);
  const category = categories.find((item) => item.slug === slug);

  if (!category) {
    notFound();
  }

  const parentCategory = category.parentId ? categories.find((item) => item.id === category.parentId) : null;
  const query = {
    search: '',
    category: parentCategory?.slug || category.slug,
    subcategory: parentCategory ? category.slug : 'Toate',
    sort: 'featured',
    page: 1,
    perPage: 12,
    colors: [],
    sizes: [],
  };

  return (
    <main className="px-10 py-8 sm:px-20 lg:px-32">
      <CatalogPageContent products={products} categories={categories} query={query} />
    </main>
  );
}
