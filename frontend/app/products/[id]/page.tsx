import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import ProductHistoryRecorder from '@/components/product-history-recorder';
import ProductImageMagnifier from '@/components/product-image-magnifier';
import ProductPurchaseControls from '@/components/product-purchase-controls';
import { ProductReviewsProvider } from '@/components/product-reviews-provider';
import ReviewsSection from '@/components/reviews-section';
import ReviewsSummary from '@/components/reviews-summary';
import SimilarProductsSlider from '@/components/similar-products-slider';
import { formatCategoryLabel } from '@/lib/format-category-label';

type Product = {
  id: number;
  name: string;
  slug?: string | null;
  description: string | null;
  shortDescription?: string | null;
  tag?: string | null;
  price: string;
  currency?: string;
  imageUrl: string | null;
  category?: {
    id: number | null;
    name: string;
    slug: string;
  } | null;
  categories?: ProductCategory[];
  categoryId: number | null;
  sku?: string | null;
  stockQuantity?: number;
  material?: string | null;
  attributes?: ProductAttribute[];
  options?: ProductOption[] | ProductOption;
  variants?: ProductVariant[];
  sizes?: string[];
  createdAt: string;
};

type ProductCategory = {
  id: number;
  name: string;
  slug: string;
  isPrimary?: boolean;
};

type Category = {
  id: number;
  parentId: number | null;
  name: string;
  slug: string;
  parent?: {
    id: number | null;
    name: string;
    slug: string;
  } | null;
};

type ProductAttribute = {
  key: string;
  value: string;
  sortOrder?: number;
};

type ProductOption = {
  name: string;
  values: string[];
  valueDetails?: ProductOptionValue[];
};

type ProductOptionValue = {
  value: string;
  imageUrl?: string | null;
  swatchColor?: string | null;
  legacyOptionValueId?: number | null;
};

type ProductVariant = {
  optionName: string;
  optionValue: string;
  legacyOptionValueId?: number | null;
  combinationId?: string | null;
  model?: string | null;
  sku?: string | null;
  priceDelta?: number | string | null;
  pricePrefix?: string | null;
  quantity?: number;
};

const normalizeOptions = (product: Product): ProductOption[] => {
  const apiOptions = Array.isArray(product.options)
    ? product.options
    : product.options
      ? [product.options]
      : [];
  const options = apiOptions
    .map((option) => {
      const name = String(option.name || 'Optiune').trim();
      const valueDetails = (option.valueDetails || [])
        .map((item) => ({
          value: String(item.value || '').trim(),
          imageUrl: item.imageUrl || null,
          swatchColor: item.swatchColor || null,
          legacyOptionValueId: item.legacyOptionValueId ?? null,
        }))
        .filter((item) => item.value);
      const isColorOption = name.toLowerCase().includes('culoare');
      const hasImageChoices = valueDetails.some((item) => item.imageUrl);
      const visibleValueDetails = isColorOption && hasImageChoices
        ? valueDetails.filter((item) => item.imageUrl)
        : isColorOption
          ? []
        : valueDetails;
      const values =
        visibleValueDetails.length > 0
          ? visibleValueDetails.map((item) => item.value)
          : (option.values || []).map((value) => String(value).trim()).filter(Boolean);

      return {
        name,
        values: Array.from(new Set(values)),
        valueDetails: visibleValueDetails,
      };
    })
    .filter((option) => option.name && option.values.length > 0 && option.valueDetails.length > 0);

  if (options.length > 0) {
    return options;
  }

  return [];
};

const optionChoices = (option: ProductOption | null) =>
  option?.valueDetails && option.valueDetails.length > 0
    ? option.valueDetails
    : (option?.values || []).map((value) => ({ value }));

const optionDisplayOrder = (name: string) => {
  const normalizedName = name.toLowerCase();
  if (normalizedName.includes('culoare')) return 0;
  if (normalizedName.includes('dimensiune') || normalizedName.includes('marime')) return 1;
  return 2;
};

const getPurchaseOptionGroups = (product: Product) =>
  normalizeOptions(product)
    .map((option) => ({
      name: option.name,
      options: optionChoices(option),
    }))
    .sort((left, right) => optionDisplayOrder(left.name) - optionDisplayOrder(right.name));

async function getProduct(id: string): Promise<Product | null> {
  try {
    const res = await fetch(`http://127.0.0.1:3001/products/${id}`, {
      cache: 'no-store',
      signal: AbortSignal.timeout(5000),
    });

    if (!res.ok) {
      return null;
    }

    const text = await res.text();
    if (!text.trim()) {
      return null;
    }

    const data = JSON.parse(text);
    return data as Product;
  } catch (error) {
    console.error(`Failed to fetch product ${id}:`, error);
    return null;
  }
}

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
  } catch {
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
  } catch {
    return [];
  }
}

function getPrimaryProductCategory(product: Product) {
  const linkedPrimaryCategory = product.categories?.find((category) => category.isPrimary);
  if (linkedPrimaryCategory) {
    return linkedPrimaryCategory;
  }

  const linkedCategory = product.categories?.find((category) => category.id === product.categoryId);
  if (linkedCategory) {
    return linkedCategory;
  }

  if (product.category?.id && product.category.name && product.category.slug) {
    return {
      id: product.category.id,
      name: product.category.name,
      slug: product.category.slug,
    };
  }

  return null;
}

function getCategoryBreadcrumbs(product: Product, categories: Category[]) {
  const primaryCategory = getPrimaryProductCategory(product);
  if (!primaryCategory) {
    return [];
  }

  const categoryById = new Map(categories.map((category) => [category.id, category]));
  const breadcrumbItems: { label: string; href: string }[] = [];
  let currentCategory: Category | null = categoryById.get(primaryCategory.id) ?? {
    id: primaryCategory.id,
    parentId: null,
    name: primaryCategory.name,
    slug: primaryCategory.slug,
  };

  while (currentCategory) {
    breadcrumbItems.unshift({
      label: formatCategoryLabel(currentCategory.name),
      href: `/catalog?category=${currentCategory.slug}`,
    });

    currentCategory = currentCategory.parentId
      ? (categoryById.get(currentCategory.parentId) ?? null)
      : null;
  }

  if (breadcrumbItems.length === 0) {
    breadcrumbItems.push({
      label: formatCategoryLabel(primaryCategory.name),
      href: `/catalog?category=${primaryCategory.slug}`,
    });
  }

  return breadcrumbItems;
}

export default async function ProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const fetchedProduct = await getProduct(id);
  const [fetchedProducts, categories] = await Promise.all([getProducts(), getCategories()]);
  const allProducts = fetchedProducts;
  const product: Product | null = fetchedProduct;

  if (!product) {
    notFound();
  }

  const similarByCategory = allProducts.filter(
    (item) => item.id !== product.id && item.categoryId === product.categoryId,
  );
  const similarFallback = allProducts.filter((item) => item.id !== product.id);
  const similarProducts =
    (similarByCategory.length > 0 ? similarByCategory : similarFallback).slice(0, 9);
  const purchaseOptionGroups = getPurchaseOptionGroups(product);
  const categoryBreadcrumbs = getCategoryBreadcrumbs(product, categories);
  const availabilityLabel =
    product.stockQuantity === undefined || product.stockQuantity > 0 ? 'In stoc' : 'Stoc epuizat';
  const productCode = product.sku || `MGL-${String(product.id).padStart(4, '0')}`;
  const materialText = product.material || product.description || 'Material premium';

  return (
    <main className="px-6 py-8 sm:px-10 lg:px-54">
      <ProductHistoryRecorder
        product={{
          id: product.id,
          name: product.name,
          imageUrl: product.imageUrl,
        }}
      />
      <div className="mx-auto mb-8 flex w-full max-w-5xl flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm uppercase tracking-[0.3em] text-slate-500">Detalii produs</p>
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
        <div className="grid items-start gap-8 xl:grid-cols-[0.8fr_1.2fr]">
          <div className="xl:sticky xl:top-28">
            <Card className="relative aspect-square max-h-[34rem] overflow-hidden bg-white text-white shadow-xl">
              {product.imageUrl ? (
                <div className="flex h-full w-full items-end justify-center">
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
          </div>

          <Card className="space-y-6 p-8">
            <div className="space-y-3">
              <div className="flex flex-wrap items-center gap-1.5 text-[11px] uppercase tracking-[0.25em] text-slate-500">
                <Link href="/catalog" className="transition hover:text-slate-700 hover:underline">
                  Catalog
                </Link>
                {categoryBreadcrumbs.map((item) => (
                  <div key={item.href} className="flex items-center gap-1.5">
                    <span>/</span>
                    <Link href={item.href} className="transition hover:text-slate-700 hover:underline">
                      {item.label}
                    </Link>
                  </div>
                ))}
                {Number(product.price) > 20 ? <Badge className="px-2 py-0.5 text-[10px]">Popular</Badge> : null}
              </div>
              <ReviewsSummary />
              <div className="space-y-2">
                <p className="text-3xl font-semibold tracking-tight text-slate-900">{product.name}</p>
              </div>
            </div>
            <ProductPurchaseControls
              product={{
                id: product.id,
                name: product.name,
                price: product.price,
                imageUrl: product.imageUrl,
                sku: product.sku ?? null,
              }}
              productDetails={{
                material: materialText,
                tag: product.tag ?? null,
                availability: availabilityLabel,
                code: productCode,
              }}
              options={[]}
              optionGroups={purchaseOptionGroups}
              variants={product.variants ?? []}
            />
          </Card>
        </div>

        <ReviewsSection />
        <SimilarProductsSlider products={similarProducts} />
      </div>
      </ProductReviewsProvider>
    </main>
  );
}
