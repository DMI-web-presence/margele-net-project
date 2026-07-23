import CatalogPageContent from '@/components/catalog-page-content';
export const revalidate = 300;

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
    const res = await fetch('http://127.0.0.1:3001/products?view=lite', {
      next: { revalidate: 300 },
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
      next: { revalidate: 300 },
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

function parseSingleParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] || '' : value || '';
}

function parsePositiveInteger(value: string, fallback: number) {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback;
}

export default async function CatalogPage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const resolvedSearchParams = (await searchParams) ?? {};
  const [products, categories] = await Promise.all([getProducts(), getCategories()]);
  const query = {
    search: parseSingleParam(resolvedSearchParams.search).trim(),
    category: parseSingleParam(resolvedSearchParams.category).trim() || 'Toate',
    subcategory: parseSingleParam(resolvedSearchParams.subcategory).trim() || 'Toate',
    sort: parseSingleParam(resolvedSearchParams.sort).trim() || 'featured',
    page: parsePositiveInteger(parseSingleParam(resolvedSearchParams.page), 1),
    perPage: parsePositiveInteger(parseSingleParam(resolvedSearchParams.perPage), 12),
  };

  return (
    <main className="px-10 py-8 sm:px-20 lg:px-32">
      <CatalogPageContent products={products} categories={categories} query={query} />
    </main>
  );
}
