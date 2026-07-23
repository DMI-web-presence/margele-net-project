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

function parseMultiParam(value: string | string[] | undefined) {
  if (Array.isArray(value)) {
    return value.map((item) => String(item || '').trim()).filter(Boolean);
  }

  const single = String(value || '').trim();
  return single ? [single] : [];
}

function parsePositiveInteger(value: string, fallback: number) {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback;
}

function normalizeCategoryQuery(
  rawCategory: string,
  rawSubcategory: string,
  categories: Category[],
) {
  const category = rawCategory.trim() || 'Toate';
  const subcategory = rawSubcategory.trim() || 'Toate';

  if (category === 'Toate') {
    return { category, subcategory };
  }

  const matchedCategory = categories.find((item) => item.slug === category);
  if (!matchedCategory || matchedCategory.parentId == null) {
    return { category, subcategory };
  }

  const parentCategory = categories.find((item) => item.id === matchedCategory.parentId);
  if (!parentCategory) {
    return { category, subcategory };
  }

  return {
    category: parentCategory.slug,
    subcategory: subcategory === 'Toate' ? matchedCategory.slug : subcategory,
  };
}

export default async function CatalogPage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const resolvedSearchParams = (await searchParams) ?? {};
  const [products, categories] = await Promise.all([getProducts(), getCategories()]);
  const normalizedCategoryQuery = normalizeCategoryQuery(
    parseSingleParam(resolvedSearchParams.category),
    parseSingleParam(resolvedSearchParams.subcategory),
    categories,
  );
  const query = {
    search: parseSingleParam(resolvedSearchParams.search).trim(),
    category: normalizedCategoryQuery.category,
    subcategory: normalizedCategoryQuery.subcategory,
    sort: parseSingleParam(resolvedSearchParams.sort).trim() || 'featured',
    page: parsePositiveInteger(parseSingleParam(resolvedSearchParams.page), 1),
    perPage: parsePositiveInteger(parseSingleParam(resolvedSearchParams.perPage), 12),
    colors: parseMultiParam(resolvedSearchParams.colors),
    sizes: parseMultiParam(resolvedSearchParams.sizes),
  };

  return (
    <main className="px-10 py-8 sm:px-20 lg:px-32">
      <CatalogPageContent products={products} categories={categories} query={query} />
    </main>
  );
}
