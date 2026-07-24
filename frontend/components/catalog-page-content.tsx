import Image from 'next/image';
import Link from 'next/link';
import CatalogFiltersForm from '@/components/catalog-filters-form';
import CatalogPerPageSelect from '@/components/catalog-per-page-select';
import ProductFavoriteIconButton from '@/components/product-favorite-icon-button';
import { Card } from '@/components/ui/card';
import { formatCategoryLabel } from '@/lib/format-category-label';
import { toPlainText } from '@/lib/plain-text';
import { getProductImageProps } from '@/lib/product-image-variants';

type Product = {
  id: number;
  name: string;
  description: string | null;
  price: string;
  imageUrl: string | null;
  categoryId: number | null;
  category?: ProductCategory | null;
  categories?: ProductCategory[];
  attributes?: ProductAttribute[];
  options?: ProductOption[] | ProductOption;
  createdAt: string;
};

type ProductCategory = {
  id: number;
  name: string;
  slug: string;
};

type ProductAttribute = {
  key: string;
  value: string;
};

type ProductOption = {
  name: string;
  values: string[];
  valueDetails?: ProductOptionValue[];
};

type ProductOptionValue = {
  value: string;
};

type Category = {
  id: number;
  parentId: number | null;
  name: string;
  slug: string;
  sortOrder?: number;
  productCount?: number;
};

type CategoryGroup = {
  id: string;
  label: string;
  categoryIds: number[];
  categorySlugs: string[];
  children: {
    id: string;
    label: string;
    categoryIds: number[];
    categorySlugs: string[];
  }[];
};

type CatalogPageContentProps = {
  products: Product[];
  categories: Category[];
  basePath?: string;
  intro?: {
    eyebrow: string;
    title: string;
    description: string;
  };
  query: {
    search: string;
    category: string;
    subcategory: string;
    sort: string;
    page: number;
    perPage: number;
    colors: string[];
    sizes: string[];
  };
};

const numberFormatter = new Intl.NumberFormat('ro-RO', {
  style: 'currency',
  currency: 'RON',
  currencyDisplay: 'narrowSymbol',
});

const curatedRootSlugs = [
  'margele',
  'accesorii-bijuterii',
  'pandantive-si-charm-uri',
  'fire-snururi-si-elastice',
  'materiale-handmade',
  'decoratiuni-si-evenimente',
  'unelte',
  'seturi-si-mixuri',
  'reduceri-lichidare-stoc',
];

const curatedCategoryChildrenByRootSlug: Record<string, string[]> = {
  margele: [
    'margele-toho',
    'margele-miyuki',
    'margele-de-sticla',
    'margele-fatetate',
    'margele-acrilice',
    'margele-lemn',
    'margele-metalice',
    'margele-shamballa',
    'margele-cu-litere',
    'mixuri-margele',
  ],
  'accesorii-bijuterii': [
    'incuietori',
    'tortite-cercei',
    'zale-si-inele',
    'ace-si-tije',
    'capacele-margele',
    'distantieri',
    'conectori',
    'baze-brose',
    'baze-inele',
    'lanturi',
  ],
  'pandantive-si-charm-uri': [
    'pandantive-metalice',
    'charm-uri-tematice',
    'charm-uri-inimioare',
    'charm-uri-stele-flori',
    'pandantive-sticla',
    'pandantive-lemn',
    'medalioane',
  ],
  'fire-snururi-si-elastice': [
    'ata-elastica',
    'fir-siliconic',
    'snur-cerat',
    'snur-piele-ecologic',
    'sarma-modelaj',
    'fir-nylon',
    'accesorii-pentru-insirat',
  ],
  'materiale-handmade': [
    'pasta-modelatoare',
    'fetru',
    'paiete',
    'panglici',
    'pompoane',
    'nasturi-decorativi',
    'elemente-textile',
    'adezivi-si-lacuri',
  ],
  'decoratiuni-si-evenimente': [
    'craciun',
    'martisor-si-ziua-femeii',
    'paste',
    'nunta-si-botez',
    'decoratiuni-festive',
    'ambalaje-cadou',
    'accesorii-coronite',
  ],
  unelte: ['clesti-bijuterii', 'foarfeci', 'ace', 'pensete', 'organizatoare', 'matrite-si-sabloane'],
  'seturi-si-mixuri': [
    'seturi-bijuterii',
    'mixuri-accesorii',
    'mixuri-margele-seturi',
    'kituri-handmade',
    'pachete-tematice',
  ],
  'reduceri-lichidare-stoc': ['produse-reduse', 'ultimele-bucati', 'stoc-limitat'],
};

const pageSizeOptions = [12, 24, 35, 48];
const sortOptions = [
  { value: 'featured', label: 'Relevante' },
  { value: 'newest', label: 'Cele mai noi' },
  { value: 'price-asc', label: 'Pret crescator' },
  { value: 'price-desc', label: 'Pret descrescator' },
] as const;

const fallbackCategoryGroups: CategoryGroup[] = [
  {
    id: 'Toate',
    label: 'Toate categoriile',
    categoryIds: [],
    categorySlugs: [],
    children: [],
  },
  {
    id: 'uncategorized',
    label: 'Uncategorized',
    categoryIds: [],
    categorySlugs: [],
    children: [],
  },
];

const colorOptionNames = ['culoare', 'color'];
const preferredDimensionNames = ['dimensiune', 'marime', 'diametru', 'size'];
const textColorOptions = [
  { label: 'Alb', terms: ['alb', 'alba', 'albe', 'albi'] },
  { label: 'Negru', terms: ['negru', 'neagra', 'negre', 'negri'] },
  { label: 'Rosu', terms: ['rosu', 'rosie', 'rosii'] },
  { label: 'Verde', terms: ['verde', 'verzi'] },
  { label: 'Albastru', terms: ['albastru', 'albastra', 'albastre'] },
  { label: 'Galben', terms: ['galben', 'galbena', 'galbene'] },
  { label: 'Portocaliu', terms: ['portocaliu', 'portocalie', 'portocalii'] },
  { label: 'Mov', terms: ['mov', 'violet'] },
  { label: 'Roz', terms: ['roz'] },
  { label: 'Maro', terms: ['maro'] },
  { label: 'Bej', terms: ['bej'] },
  { label: 'Crem', terms: ['crem'] },
  { label: 'Gri', terms: ['gri'] },
  { label: 'Auriu', terms: ['auriu', 'aurie', 'aurii'] },
  { label: 'Argintiu', terms: ['argintiu', 'argintie', 'argintii'] },
  { label: 'Bronz', terms: ['bronz'] },
  { label: 'Cupru', terms: ['cupru'] },
  { label: 'Transparent', terms: ['transparent', 'transparente'] },
  { label: 'Natural', terms: ['natural', 'natur'] },
  { label: 'Multicolor', terms: ['multicolor', 'mix'] },
] as const;

export default function CatalogPageContent({
  products,
  categories,
  basePath = '/catalog',
  intro = {
    eyebrow: 'Articole atent selectionate',
    title: 'Cantitati en-gross',
    description:
      'Fiecare material este de calitate superioara, aduse din cele mai bune surse, pentru a te ajuta sa creezi orice iti imaginezi.',
  },
  query,
}: CatalogPageContentProps) {
  const categoryGroups = buildCategoryGroups(categories);
  const selectedGroup = categoryGroups.find((group) => group.id === query.category) ?? categoryGroups[0];
  const normalizedSearch = query.search.trim().toLowerCase();
  const categoryScopedProducts = products.filter((product) =>
    productMatchesCategoryGroup(product, selectedGroup, query.subcategory),
  );
  const colorOptions = getOptionValuesByName(categoryScopedProducts, colorOptionNames);
  const sizeOptions = getOptionValuesByName(categoryScopedProducts, preferredDimensionNames);

  const filteredProducts = categoryScopedProducts
    .filter((product) => {
      if (!normalizedSearch) return true;
      return productSearchText(product).includes(normalizedSearch);
    })
    .filter((product) => productMatchesFacetValues(product, query.colors, colorOptionNames))
    .filter((product) => productMatchesFacetValues(product, query.sizes, preferredDimensionNames))
    .sort((left, right) => sortProducts(left, right, query.sort));

  const totalPages = Math.max(1, Math.ceil(filteredProducts.length / query.perPage));
  const currentPage = Math.min(Math.max(1, query.page), totalPages);
  const pageStartIndex = (currentPage - 1) * query.perPage;
  const paginatedProducts = filteredProducts.slice(pageStartIndex, pageStartIndex + query.perPage);
  const displayStart = filteredProducts.length === 0 ? 0 : pageStartIndex + 1;
  const displayEnd = Math.min(pageStartIndex + query.perPage, filteredProducts.length);
  const visiblePages = Array.from({ length: totalPages }, (_, index) => index + 1).filter((page) => {
    if (totalPages <= 5) return true;
    if (page === 1 || page === totalPages) return true;
    return Math.abs(page - currentPage) <= 1;
  });
  const selectedSort =
    sortOptions.find((option) => option.value === query.sort)?.value ?? sortOptions[0].value;

  return (
    <div className="space-y-8">
      <Card className="bg-slate-50 p-8 shadow-sm">
        <div className="max-w-2xl">
          <p className="text-sm uppercase tracking-[0.3em] text-slate-500">{intro.eyebrow}</p>
          <h1 className="mt-4 text-4xl font-semibold tracking-tight text-slate-900 sm:text-5xl">
            {intro.title}
          </h1>
          <p className="mt-4 max-w-xl text-sm leading-7 text-slate-600 sm:text-base">
            {intro.description}
          </p>
        </div>
      </Card>

      <section className="grid gap-6 lg:grid-cols-[17rem_1fr]">
        <aside className="h-fit rounded-3xl border border-slate-200 bg-white p-5 shadow-sm lg:sticky lg:top-24">
          <CatalogFiltersForm
            key={JSON.stringify(query)}
            categoryGroups={categoryGroups}
            search={query.search}
            category={selectedGroup.id}
            subcategory={query.subcategory}
            sort={selectedSort}
            colorOptions={colorOptions}
            selectedColors={query.colors.filter((value) => colorOptions.includes(value))}
            sizeOptions={sizeOptions}
            selectedSizes={query.sizes.filter((value) => sizeOptions.includes(value))}
            sortOptions={sortOptions}
          />
        </aside>

        <div>
          <div className="flex items-center justify-between gap-4 sm:flex-row sm:gap-0">
            <div>
              <p className="text-sm font-medium text-slate-500">{filteredProducts.length} produse in total</p>
            </div>
            <CatalogPerPageSelect
              value={query.perPage}
              options={pageSizeOptions}
              search={query.search}
              category={query.category}
              subcategory={query.subcategory}
              sort={query.sort}
              colors={query.colors}
              sizes={query.sizes}
            />
          </div>

          <div className="mt-6 grid items-stretch gap-4 sm:grid-cols-2 lg:grid-cols-[repeat(auto-fill,minmax(15rem,1fr))]">
            {paginatedProducts.map((product) => (
              <Card
                key={product.id}
                className="flex h-full w-full flex-col overflow-hidden rounded-[2rem] border-slate-200 transition hover:-translate-y-1 hover:shadow-md"
              >
                <div className="relative">
                  <Link href={`/products/${product.id}`} className="group block">
                    <div className="flex h-72 items-center justify-center bg-slate-100 sm:h-65">
                      {product.imageUrl ? (
                        <Image
                          {...getProductImageProps(product.imageUrl, 'card')}
                          alt={product.name}
                          className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
                          unoptimized
                        />
                      ) : (
                        <div className="flex h-full items-center justify-center text-sm text-slate-500">
                          No image available
                        </div>
                      )}
                    </div>
                  </Link>
                  <div className="absolute right-2 top-2 z-10">
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

                <div className="flex flex-1 flex-col space-y-3 p-4">
                  <div className="space-y-1.5">
                    <Link
                      href={`/products/${product.id}`}
                      className="line-clamp-2 min-h-[3.5rem] text-base font-semibold text-slate-900 transition hover:text-indigo-600"
                    >
                      {product.name}
                    </Link>
                    <p className="line-clamp-2 min-h-[2.75rem] text-sm text-slate-500">
                      {toPlainText(product.description) || 'Material premium pentru proiecte handmade.'}
                    </p>
                    {product.category?.name ? (
                      <p className="text-xs font-medium uppercase tracking-[0.18em] text-slate-400">
                        {formatCategoryLabel(product.category.name)}
                      </p>
                    ) : null}
                  </div>
                </div>

                <div className="flex items-center justify-between gap-2 border-t border-slate-200 px-4 py-6">
                  <div className="flex min-w-0 flex-col">
                    <p className="text-2xl font-semibold leading-tight text-slate-900">
                      {numberFormatter.format(Number(product.price))}
                    </p>
                  </div>
                  <Link
                    href={`/products/${product.id}`}
                    className="inline-flex h-9 shrink-0 cursor-pointer items-center justify-center rounded-xl bg-indigo-600 px-4 text-xs font-semibold text-white transition hover:bg-indigo-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 focus-visible:ring-offset-2"
                  >
                    Vezi produsul
                  </Link>
                </div>
              </Card>
            ))}
          </div>

          <div className="mt-6 flex flex-col gap-3 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm text-slate-700 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-slate-700">
              Afisare {displayStart} - {displayEnd} din {filteredProducts.length}
            </p>

            <div className="flex items-center gap-1">
              <PaginationLink label="|‹" ariaLabel="Prima pagina" href={buildCatalogHref(query, 1, basePath)} disabled={currentPage === 1} />
              <PaginationLink label="‹" ariaLabel="Pagina precedenta" href={buildCatalogHref(query, Math.max(1, currentPage - 1), basePath)} disabled={currentPage === 1} />
              {visiblePages.map((page, index) => {
                const previousPage = visiblePages[index - 1];
                const showGap = previousPage != null && page - previousPage > 1;
                return (
                  <span key={page} className="flex items-center gap-1">
                    {showGap ? <span className="px-1 text-slate-400">...</span> : null}
                    <PaginationLink
                      label={String(page)}
                      href={buildCatalogHref(query, page, basePath)}
                      current={page === currentPage}
                    />
                  </span>
                );
              })}
              <PaginationLink label="›" ariaLabel="Pagina urmatoare" href={buildCatalogHref(query, Math.min(totalPages, currentPage + 1), basePath)} disabled={currentPage === totalPages} />
              <PaginationLink label="›|" ariaLabel="Ultima pagina" href={buildCatalogHref(query, totalPages, basePath)} disabled={currentPage === totalPages} />
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

function PaginationLink({
  href,
  label,
  ariaLabel,
  current = false,
  disabled = false,
}: {
  href: string;
  label: string;
  ariaLabel?: string;
  current?: boolean;
  disabled?: boolean;
}) {
  const className = current
    ? 'inline-flex h-8 min-w-8 items-center justify-center rounded-md border border-[#7b4a75] bg-white px-2 text-[#7b4a75] transition'
    : 'inline-flex h-8 min-w-8 items-center justify-center rounded-md border border-slate-200 bg-white px-2 text-slate-600 transition hover:bg-slate-50 hover:text-slate-900';

  if (disabled) {
    return (
      <span
        aria-disabled="true"
        className="inline-flex h-8 min-w-8 cursor-not-allowed items-center justify-center rounded-md border border-slate-200 bg-white px-2 text-slate-500 opacity-40"
      >
        {label}
      </span>
    );
  }

  return (
    <Link href={href} aria-label={ariaLabel} aria-current={current ? 'page' : undefined} className={className}>
      {label}
    </Link>
  );
}

function buildCatalogHref(
  query: CatalogPageContentProps['query'],
  page: number,
  basePath = '/catalog',
) {
  const params = new URLSearchParams();

  if (query.search) params.set('search', query.search);
  if (query.category && query.category !== 'Toate') params.set('category', query.category);
  if (query.subcategory && query.subcategory !== 'Toate') params.set('subcategory', query.subcategory);
  if (query.sort && query.sort !== 'featured') params.set('sort', query.sort);
  if (query.perPage !== 12) params.set('perPage', String(query.perPage));
  for (const color of query.colors) {
    params.append('colors', color);
  }
  for (const size of query.sizes) {
    params.append('sizes', size);
  }
  if (page > 1) params.set('page', String(page));

  const nextQuery = params.toString();
  return nextQuery ? `${basePath}?${nextQuery}` : basePath;
}

function getProductPrice(product: Product) {
  const numericPrice = Number(product.price);
  return Number.isFinite(numericPrice) ? numericPrice : 0;
}

function sortProducts(left: Product, right: Product, sort: string) {
  if (sort === 'price-asc') {
    return getProductPrice(left) - getProductPrice(right);
  }

  if (sort === 'price-desc') {
    return getProductPrice(right) - getProductPrice(left);
  }

  if (sort === 'newest') {
    return right.id - left.id;
  }

  return left.id - right.id;
}

function productSearchText(product: Product) {
  return `${product.name} ${toPlainText(product.description)} ${getAllProductOptionTags(product).join(' ')} ${(product.attributes || [])
    .map((attribute) => `${attribute.key}: ${attribute.value}`)
    .join(' ')} ${product.category?.name ?? ''}`.toLowerCase();
}

function buildCategoryGroups(categories: Category[] = []) {
  if (categories.length === 0) {
    return fallbackCategoryGroups;
  }

  const childrenByParentId = new Map<number, Category[]>();
  for (const category of categories) {
    if (!category.parentId) continue;
    const children = childrenByParentId.get(category.parentId) || [];
    children.push(category);
    childrenByParentId.set(category.parentId, children);
  }

  const curatedRootOrder = new Map(curatedRootSlugs.map((slug, index) => [slug, index]));
  const roots = categories
    .filter((category) => category.parentId == null && category.slug !== 'uncategorized')
    .filter((root) => {
      const children = childrenByParentId.get(root.id) || [];
      return (
        (root.productCount ?? 0) > 0 ||
        children.some((child) => (child.productCount ?? 0) > 0)
      );
    })
    .sort((left, right) => {
      const leftCuratedOrder = curatedRootOrder.get(left.slug);
      const rightCuratedOrder = curatedRootOrder.get(right.slug);

      if (leftCuratedOrder !== undefined || rightCuratedOrder !== undefined) {
        return (leftCuratedOrder ?? Number.MAX_SAFE_INTEGER) - (rightCuratedOrder ?? Number.MAX_SAFE_INTEGER);
      }

      return (
        Number(left.sortOrder ?? 0) - Number(right.sortOrder ?? 0) ||
        left.name.localeCompare(right.name, 'ro')
      );
    });

  const dynamicGroups = roots.map((root) => {
    const childOrder = curatedCategoryChildrenByRootSlug[root.slug] || [];
    const children = (childrenByParentId.get(root.id) || [])
      .filter((child) => (child.productCount ?? 0) > 0)
      .sort((left, right) => {
        const leftCuratedOrder = childOrder.indexOf(left.slug);
        const rightCuratedOrder = childOrder.indexOf(right.slug);
        const leftIsCurated = leftCuratedOrder >= 0;
        const rightIsCurated = rightCuratedOrder >= 0;

        if (leftIsCurated || rightIsCurated) {
          return (
            (leftIsCurated ? leftCuratedOrder : Number.MAX_SAFE_INTEGER) -
            (rightIsCurated ? rightCuratedOrder : Number.MAX_SAFE_INTEGER)
          );
        }

        return (
          Number(left.sortOrder ?? 0) - Number(right.sortOrder ?? 0) ||
          left.name.localeCompare(right.name, 'ro')
        );
      })
      .map((child) => ({
        id: child.slug || String(child.id),
        label: formatCategoryLabel(child.name),
        categoryIds: [child.id],
        categorySlugs: [child.slug],
      }));

    return {
      id: root.slug || String(root.id),
      label: formatCategoryLabel(root.name),
      categoryIds: [root.id],
      categorySlugs: [root.slug],
      children,
    };
  });

  return [fallbackCategoryGroups[0], ...dynamicGroups, fallbackCategoryGroups[1]];
}

function productMatchesCategoryGroup(
  product: Product,
  group: CategoryGroup,
  selectedSubcategory: string,
) {
  if (group.id === 'Toate') return true;
  if (group.id === 'uncategorized') return product.categoryId == null;

  const productCategories = product.categories || [];
  const productIds = new Set([
    ...(product.categoryId ? [product.categoryId] : []),
    ...productCategories.map((category) => category.id),
    ...(product.category?.id ? [product.category.id] : []),
  ]);
  const productSlugs = new Set([
    ...productCategories.map((category) => category.slug).filter(Boolean),
    ...(product.category?.slug ? [product.category.slug] : []),
  ]);

  if (selectedSubcategory !== 'Toate') {
    const child = group.children.find((item) => item.id === selectedSubcategory);
    if (!child) return false;

    return (
      child.categoryIds.some((id) => productIds.has(id)) ||
      child.categorySlugs.some((slug) => productSlugs.has(slug))
    );
  }

  const candidates = [group, ...group.children];
  return candidates.some(
    (candidate) =>
      candidate.categoryIds.some((id) => productIds.has(id)) ||
      candidate.categorySlugs.some((slug) => productSlugs.has(slug)),
  );
}

function normalizeProductOptions(product: Product): ProductOption[] {
  const apiOptions = Array.isArray(product.options)
    ? product.options
    : product.options
      ? [product.options]
      : [];

  return apiOptions
    .map((option) => {
      const name = String(option.name || 'Optiune').trim();
      const valueDetails = option.valueDetails || [];
      const values = option.values || [];

      return {
        name,
        values: Array.from(
          new Set(
            [
              ...values.map((value) => String(value || '').trim()),
              ...valueDetails.map((value) => String(value.value || '').trim()),
            ].filter(Boolean),
          ),
        ),
      };
    })
    .filter((option) => option.name && option.values.length > 0);
}

function getAllProductOptionTags(product: Product) {
  return normalizeProductOptions(product).flatMap((option) =>
    option.values.map((value) => `${option.name}: ${value}`),
  );
}

function optionMatchesNames(option: ProductOption, preferredNames: string[]) {
  return preferredNames.some((name) => option.name.toLowerCase().includes(name));
}

function textMatchesTerm(text: string, term: string) {
  return new RegExp(`(^|[^a-z0-9])${term}([^a-z0-9]|$)`, 'i').test(text);
}

function getTextColorValues(product: Product) {
  return textColorOptions
    .filter((color) => color.terms.some((term) => textMatchesTerm(productSearchText(product), term)))
    .map((color) => color.label);
}

function getTextDimensionValues(product: Product) {
  return Array.from(
    new Set(
      Array.from(productSearchText(product).matchAll(/\b\d+(?:[.,]\d+)?\s?(?:mm|cm|m)\b/gi)).map(
        ([value]) => value.replace(/\s+/g, '').replace(',', '.'),
      ),
    ),
  );
}

function getProductFacetValues(product: Product, preferredNames: string[]) {
  const structuredValues = [
    ...normalizeProductOptions(product)
      .filter((option) => optionMatchesNames(option, preferredNames))
      .flatMap((option) => option.values),
    ...(product.attributes || [])
      .filter((attribute) =>
        preferredNames.some((name) => attribute.key.toLowerCase().includes(name)),
      )
      .map((attribute) => attribute.value),
  ];

  const textValues =
    preferredNames === colorOptionNames
      ? getTextColorValues(product)
      : preferredNames === preferredDimensionNames
        ? getTextDimensionValues(product)
        : [];

  return Array.from(new Set([...structuredValues, ...textValues]))
    .filter(Boolean)
    .sort((left, right) => left.localeCompare(right, 'ro', { numeric: true }));
}

function getOptionValuesByName(products: Product[], preferredNames: string[]) {
  return Array.from(
    new Set(products.flatMap((product) => getProductFacetValues(product, preferredNames))),
  ).sort((left, right) => left.localeCompare(right, 'ro', { numeric: true }));
}

function productMatchesFacetValues(
  product: Product,
  selectedValues: string[],
  preferredNames: string[],
) {
  if (selectedValues.length === 0) return true;

  const productValues = new Set(getProductFacetValues(product, preferredNames));
  return selectedValues.some((value) => productValues.has(value));
}
