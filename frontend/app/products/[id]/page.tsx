import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import ProductHistoryRecorder from '@/components/product-history-recorder';
import ProductImageMagnifier from '@/components/product-image-magnifier';
import ProductPurchaseControls from '@/components/product-purchase-controls';
import Reveal from '@/components/reveal';
import { ProductReviewsProvider } from '@/components/product-reviews-provider';
import ReviewsSection from '@/components/reviews-section';
import ReviewsSummary from '@/components/reviews-summary';
import SimilarProductsSlider from '@/components/similar-products-slider';
import { formatCategoryLabel } from '@/lib/format-category-label';
import { toPlainText } from '@/lib/plain-text';
import { absoluteUrl, buildPageMetadata, categoryCatalogPath, productPath, seoDescription, siteName } from '@/lib/seo';

const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL ?? 'http://127.0.0.1:3001';

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
  images?: Array<{ imageUrl: string; altText?: string | null }>;
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
  reviewSummary?: {
    reviewsCount: number;
    averageRating: number;
  };
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
  id?: number;
  optionName: string;
  optionValue: string;
  optionValues?: Record<string, string> | null;
  legacyOptionValueId?: number | null;
  combinationId?: string | null;
  model?: string | null;
  sku?: string | null;
  variantPrice?: number | string | null;
  priceDelta?: number | string | null;
  pricePrefix?: string | null;
  quantity?: number;
  imageUrl?: string | null;
  isActive?: boolean;
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
      const visibleValueDetails = valueDetails;
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
    .filter((option) => option.name && option.values.length > 0);

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

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const product = await getProduct(id);

  if (!product) {
    return buildPageMetadata({
      title: 'Produs indisponibil',
      description: 'Produsul cautat nu este disponibil momentan pe Margele.net.',
      path: `/products/${encodeURIComponent(id)}`,
      noindex: true,
    });
  }

  return buildPageMetadata({
    title: product.name,
    description: seoDescription(product.shortDescription || product.description, `${product.name} disponibil pe Margele.net.`),
    path: productPath(product),
    image: product.imageUrl,
  });
}

async function getProduct(id: string): Promise<Product | null> {
  try {
    const res = await fetch(`${backendUrl}/products/${id}`, {
      cache: 'no-store',
      signal: AbortSignal.timeout(20000),
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
    const res = await fetch(`${backendUrl}/products`, {
      cache: 'no-store',
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
  } catch {
    return [];
  }
}

async function getCategories(): Promise<Category[]> {
  try {
    const res = await fetch(`${backendUrl}/categories`, {
      cache: 'no-store',
      signal: AbortSignal.timeout(20000),
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
        href: categoryCatalogPath(currentCategory),
      });

    currentCategory = currentCategory.parentId
      ? (categoryById.get(currentCategory.parentId) ?? null)
      : null;
  }

  if (breadcrumbItems.length === 0) {
    breadcrumbItems.push({
      label: formatCategoryLabel(primaryCategory.name),
      href: categoryCatalogPath(primaryCategory),
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
  const combinationVariants = (product.variants || []).filter(
    (variant) =>
      variant.isActive !== false &&
      variant.optionValues &&
      Object.keys(variant.optionValues).length > 0,
  );
  const availabilityLabel =
    combinationVariants.length > 0
      ? combinationVariants.some((variant) => Number(variant.quantity || 0) > 0)
        ? 'In stoc'
        : 'Stoc epuizat'
      : product.stockQuantity === undefined || product.stockQuantity > 0
        ? 'In stoc'
        : 'Stoc epuizat';
  const productCode = product.sku || `MGL-${String(product.id).padStart(4, '0')}`;
  const materialText = toPlainText(product.material || product.description) || 'Material premium';
  const productJsonLd = buildProductJsonLd(product, {
    availabilityLabel,
    productCode,
    path: productPath(product),
  });

  return (
    <main className="px-4 py-4 sm:px-10 sm:py-8 lg:px-54">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(productJsonLd).replace(/</g, '\\u003c') }}
      />
      <ProductHistoryRecorder
        product={{
          id: product.id,
          name: product.name,
          imageUrl: product.imageUrl,
        }}
      />
      <div className="animate-hero-item mx-auto mb-4 hidden w-full max-w-5xl flex-col gap-4 sm:mb-8 sm:flex sm:flex-row sm:items-center sm:justify-between">
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
        <div className="grid items-start gap-4 sm:gap-8 xl:grid-cols-[0.8fr_1.2fr]">
          <div className="xl:sticky xl:top-28">
            <Card className="animate-hero-image relative mx-auto aspect-[4/3] max-h-[18rem] overflow-hidden rounded-2xl bg-white text-white shadow-lg sm:aspect-square sm:max-h-[34rem] sm:rounded-3xl sm:shadow-xl">
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

          <Card
            className="animate-hero-item space-y-4 rounded-2xl p-4 sm:space-y-6 sm:rounded-3xl sm:p-8"
            style={{ animationDelay: '160ms' }}
          >
            <div className="space-y-2 sm:space-y-3">
              <div className="flex flex-wrap items-center gap-1.5 text-[10px] uppercase tracking-[0.18em] text-slate-500 sm:text-[11px] sm:tracking-[0.25em]">
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
                <p className="text-2xl font-semibold leading-tight tracking-tight text-slate-900 sm:text-3xl">{product.name}</p>
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

        <Reveal>
          <ReviewsSection />
        </Reveal>
        <Reveal>
          <SimilarProductsSlider products={similarProducts} />
        </Reveal>
      </div>
      </ProductReviewsProvider>
    </main>
  );
}

function buildProductJsonLd(
  product: Product,
  {
    availabilityLabel,
    productCode,
    path,
  }: {
    availabilityLabel: string;
    productCode: string;
    path: string;
  },
) {
  const imageUrls = [
    product.imageUrl,
    ...(product.images || []).map((image) => image.imageUrl),
    ...(product.variants || []).map((variant) => variant.imageUrl || null),
  ].filter(Boolean) as string[];
  const uniqueImageUrls = Array.from(new Set(imageUrls));
  const description = seoDescription(product.shortDescription || product.description, `${product.name} disponibil pe Margele.net.`);
  const availability =
    availabilityLabel === 'In stoc'
      ? 'https://schema.org/InStock'
      : 'https://schema.org/OutOfStock';

  return {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.name,
    image: uniqueImageUrls.length > 0 ? uniqueImageUrls : [absoluteUrl('/favicon.png')],
    description,
    sku: productCode,
    brand: {
      '@type': 'Brand',
      name: siteName,
    },
    category: getPrimaryProductCategory(product)?.name || undefined,
    aggregateRating:
      product.reviewSummary && product.reviewSummary.reviewsCount > 0
        ? {
            '@type': 'AggregateRating',
            ratingValue: Number(product.reviewSummary.averageRating || 0).toFixed(1),
            reviewCount: product.reviewSummary.reviewsCount,
          }
        : undefined,
    offers: {
      '@type': 'Offer',
      url: absoluteUrl(path),
      priceCurrency: product.currency || 'RON',
      price: Number(product.price || 0).toFixed(2),
      availability,
      itemCondition: 'https://schema.org/NewCondition',
      seller: {
        '@type': 'Organization',
        name: siteName,
      },
    },
  };
}
