import Image from 'next/image';
import Link from 'next/link';
import CatalogFiltersForm from '@/components/catalog-filters-form';
import CatalogPerPageSelect from '@/components/catalog-per-page-select';
import ProductFavoriteIconButton from '@/components/product-favorite-icon-button';
import Reveal from '@/components/reveal';
import { Card } from '@/components/ui/card';
import { formatCategoryLabel } from '@/lib/format-category-label';
import { toPlainText } from '@/lib/plain-text';
import { getProductImageProps } from '@/lib/product-image-variants';

type Product = {
  id: number;
  name: string;
  description: string | null;
  price: string;
  displayPrice?: string | number | null;
  hasFromPrice?: boolean;
  imageUrl: string | null;
  categoryId: number | null;
  sku?: string | null;
  searchTokens?: string[];
  category?: ProductCategory | null;
  categories?: ProductCategory[];
  attributes?: ProductAttribute[];
  options?: ProductOption[] | ProductOption;
  reviewSummary?: {
    reviewsCount: number;
    averageRating: number;
  };
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

function ProductCardRating({ product }: { product: Product }) {
  const reviewsCount = Number(product.reviewSummary?.reviewsCount || 0);
  if (reviewsCount < 1) return null;

  const averageRating = Number(product.reviewSummary?.averageRating || 0);
  const roundedRating = Math.round(averageRating);

  return (
    <div className="flex min-h-5 items-center gap-1.5 text-xs text-slate-500">
      <span className="inline-flex items-center gap-0.5 text-amber-500" aria-label={`Rating ${averageRating.toFixed(1)} din 5`}>
        {[1, 2, 3, 4, 5].map((star) => (
          <svg
            key={star}
            viewBox="0 0 24 24"
            className={`h-3.5 w-3.5 ${roundedRating >= star ? 'fill-current' : 'fill-none text-slate-300'}`}
            stroke="currentColor"
            strokeWidth="1.8"
          >
            <path d="m12 3 2.7 5.5 6.1.9-4.4 4.3 1 6.1-5.4-2.9-5.4 2.9 1-6.1-4.4-4.3 6.1-.9L12 3Z" />
          </svg>
        ))}
      </span>
      <span className="font-semibold text-slate-700">{averageRating.toFixed(1)}</span>
      <span>({reviewsCount})</span>
    </div>
  );
}

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
      <section className="relative overflow-hidden rounded-[1.35rem] border border-slate-200 bg-[linear-gradient(105deg,#fff_0%,#fbf7ff_48%,#f8fbff_100%)] shadow-sm sm:rounded-[1.75rem]">
        <div className="home-stagger grid gap-6 p-5 sm:p-8 lg:grid-cols-[1.2fr_0.8fr] lg:p-10">
          <div className="relative z-10">
            <p className="text-xs font-bold uppercase tracking-[0.3em] text-[#4f2048]">{intro.eyebrow}</p>
            <h1 className="mt-3 max-w-2xl text-4xl font-bold tracking-tight text-slate-950 sm:text-5xl">
              {intro.title}
            </h1>
            <p className="mt-4 max-w-xl text-sm font-medium leading-7 text-slate-700 sm:text-base">
              Materiale atent alese, disponibile in cantitati mai mari pentru proiecte creative,
              ateliere si revanzare.
            </p>

            <div className="mt-7 hidden gap-3 sm:grid sm:grid-cols-2 xl:grid-cols-4">
              <WholesaleBenefit icon="discount" title="Discount la volum" text="Preturi mai bune in functie de cantitatea comandata." />
              <WholesaleBenefit icon="stock" title="Stocuri pentru ateliere" text="Produse disponibile constant in cantitati mari." />
              <WholesaleBenefit icon="repeat" title="Comenzi recurente" text="Recomandari si livrare programata simplu." />
              <WholesaleBenefit icon="support" title="Oferta personalizata" text="Ai nevoie de altceva? Cere oferta dedicata." />
            </div>

            <div className="mt-7 hidden flex-col gap-3 sm:flex sm:flex-row sm:items-center">
              <Link
                href="/contact"
                className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-[#4f2048] px-5 text-sm font-bold text-white shadow-[0_12px_26px_rgba(79,32,72,0.24)] transition hover:bg-[#401839]"
              >
                <WholesaleIcon name="bag" />
                Cere oferta en-gross
              </Link>
              <Link
                href="/cum-cumpar"
                className="inline-flex h-11 items-center justify-center gap-2 rounded-xl px-5 text-sm font-bold text-slate-900 underline-offset-4 transition hover:text-[#4f2048] hover:underline"
              >
                Vezi conditiile
                <span aria-hidden="true">&gt;</span>
              </Link>
            </div>
          </div>

          <div className="relative aspect-[7/4] overflow-hidden rounded-[1.15rem]">
            <Image
              src="/wholesale-atelier-packs.png"
              alt="Pachete atelier cu margele, accesorii si materiale creative"
              fill
              className="object-contain"
              sizes="(min-width: 1024px) 38vw, 100vw"
              priority
            />
          </div>
        </div>
      </section>

      <Reveal>
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
            totalProducts={filteredProducts.length}
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

          <div className="home-stagger mt-6 grid items-stretch gap-4 pb-20 sm:grid-cols-2 sm:pb-0 lg:grid-cols-[repeat(auto-fill,minmax(15rem,1fr))]">
            {paginatedProducts.map((product) => {
              const priceInfo = getCatalogPriceInfo(product);

              return (
              <Card
                key={product.id}
                className="flex h-full w-full flex-col overflow-hidden rounded-[1.35rem] border-slate-200 transition hover:-translate-y-1 hover:shadow-md sm:rounded-[2rem]"
              >
                <div className="relative">
                  <Link href={`/products/${product.id}`} className="group block">
                    <div className="flex h-48 items-center justify-center bg-slate-100 sm:h-65">
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
                        price: priceInfo.amount.toFixed(2),
                        imageUrl: product.imageUrl,
                      }}
                    />
                  </div>
                </div>

                <div className="flex flex-1 flex-col space-y-2 p-3 sm:space-y-3 sm:p-4">
                  <div className="space-y-1.5">
                    <Link
                      href={`/products/${product.id}`}
                      className="line-clamp-2 min-h-[2.8rem] text-[0.95rem] font-semibold leading-6 text-slate-900 transition hover:text-indigo-600 sm:min-h-[3.5rem] sm:text-base sm:leading-normal"
                    >
                      {product.name}
                    </Link>
                    <p className="line-clamp-1 min-h-5 text-xs leading-5 text-slate-500 sm:line-clamp-2 sm:min-h-[2.75rem] sm:text-sm">
                      {toPlainText(product.description) || 'Material premium pentru proiecte handmade.'}
                    </p>
                    <ProductCardRating product={product} />
                    {product.category?.name ? (
                      <p className="text-[0.68rem] font-medium uppercase tracking-[0.18em] text-slate-400 sm:text-xs">
                        {formatCategoryLabel(product.category.name)}
                      </p>
                    ) : null}
                  </div>
                </div>

                <div className="flex items-center justify-between gap-2 border-t border-slate-200 px-3 py-3.5 sm:px-4 sm:py-6">
                  <div className="flex min-w-0 flex-col">
                    {priceInfo.hasFromLabel ? (
                      <span className="text-[0.68rem] font-semibold uppercase tracking-[0.18em] text-slate-500 sm:text-xs">
                        De la
                      </span>
                    ) : null}
                    <p className="text-xl font-semibold leading-tight text-slate-900 sm:text-2xl">
                      {numberFormatter.format(priceInfo.amount)}
                    </p>
                  </div>
                  <Link
                    href={`/products/${product.id}`}
                    className="inline-flex h-10 shrink-0 cursor-pointer items-center justify-center rounded-xl bg-indigo-600 px-5 text-sm font-semibold text-white transition hover:bg-indigo-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 focus-visible:ring-offset-2 sm:h-9 sm:px-4 sm:text-xs"
                  >
                    Vezi <span className="hidden sm:inline">&nbsp;produsul</span>
                  </Link>
                </div>
              </Card>
              );
            })}
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
      </Reveal>
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
    ? 'inline-flex h-8 min-w-8 items-center justify-center rounded-md border border-[#4f2048] bg-white px-2 text-[#4f2048] transition'
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

function WholesaleBenefit({
  icon,
  title,
  text,
}: {
  icon: WholesaleIconName;
  title: string;
  text: string;
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white/75 p-4 shadow-[0_10px_24px_rgba(15,23,42,0.05)] backdrop-blur">
      <div className="text-[#4f2048]">
        <WholesaleIcon name={icon} />
      </div>
      <h2 className="mt-3 text-sm font-bold text-slate-950">{title}</h2>
      <p className="mt-1 text-xs font-medium leading-5 text-slate-600">{text}</p>
    </div>
  );
}

type WholesaleIconName = 'discount' | 'stock' | 'repeat' | 'support' | 'bag';

function WholesaleIcon({ name }: { name: WholesaleIconName }) {
  const className = 'h-6 w-6 fill-none stroke-current stroke-[1.8]';

  if (name === 'discount') {
    return (
      <svg aria-hidden="true" viewBox="0 0 24 24" className={className}>
        <path d="m12 2 2.1 3.2 3.8-.2.2 3.8L21.3 11l-3.2 2.1.2 3.8-3.8.2L12 20.3l-2.1-3.2-3.8.2-.2-3.8L2.7 11l3.2-2.1-.2-3.8 3.8-.2L12 2Z" />
        <path d="m9 15 6-6M9.5 9.5h.01M14.5 14.5h.01" />
      </svg>
    );
  }

  if (name === 'stock') {
    return (
      <svg aria-hidden="true" viewBox="0 0 24 24" className={className}>
        <path d="m12 3 8 4.5v9L12 21l-8-4.5v-9L12 3Z" />
        <path d="m4.5 7.8 7.5 4.3 7.5-4.3M12 12v9" />
      </svg>
    );
  }

  if (name === 'repeat') {
    return (
      <svg aria-hidden="true" viewBox="0 0 24 24" className={className}>
        <path d="M3 12a8 8 0 0 1 13.7-5.6L19 8.7" />
        <path d="M19 4v4.7h-4.7M21 12a8 8 0 0 1-13.7 5.6L5 15.3" />
        <path d="M5 20v-4.7h4.7" />
      </svg>
    );
  }

  if (name === 'support') {
    return (
      <svg aria-hidden="true" viewBox="0 0 24 24" className={className}>
        <circle cx="12" cy="8" r="4" />
        <path d="M4.5 20c1.3-3.5 4-5.2 7.5-5.2s6.2 1.7 7.5 5.2" />
        <path d="M8 11.5c.7 1.3 2 2.1 4 2.1s3.3-.8 4-2.1" />
      </svg>
    );
  }

  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className="h-4 w-4 fill-none stroke-current stroke-2">
      <path d="M6 9h12l-1.2 10H7.2L6 9Z" />
      <path d="M9 9V7a3 3 0 0 1 6 0v2" />
    </svg>
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
  const numericPrice = Number(product.displayPrice ?? product.price);
  return Number.isFinite(numericPrice) ? numericPrice : 0;
}

function getCatalogPriceInfo(product: Product) {
  const amount = getProductPrice(product);

  return {
    amount,
    hasFromLabel: Boolean(product.hasFromPrice),
  };
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
  return `${product.name} ${product.sku ?? ''} ${(product.searchTokens || []).join(' ')} ${toPlainText(product.description)} ${getAllProductOptionTags(product).join(' ')} ${(product.attributes || [])
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
