'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import { useCart } from '@/components/cart-provider';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { formatCategoryLabel } from '@/lib/format-category-label';

type Product = {
  id: number;
  name: string;
  description: string | null;
  price: string;
  imageUrl: string | null;
  categoryId: number | null;
  sku?: string | null;
  category?: ProductCategory | null;
  categories?: ProductCategory[];
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
};

type ProductVariant = {
  combinationId?: string | null;
  model?: string | null;
  sku?: string | null;
  priceDelta?: number | string | null;
  pricePrefix?: string | null;
  quantity?: number | null;
};

type ProductsPageProps = {
  products: Product[];
  categories?: Category[];
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

const priceStep = 0.5;
const pageSizeOptions = [12, 24, 35, 48];

const roundToPriceStep = (value: number) => Math.round(value / priceStep) * priceStep;

const applyVariantPrice = (basePrice: number, variant?: ProductVariant) => {
  const safeBasePrice = Number.isFinite(basePrice) ? basePrice : 0;
  if (!variant) return safeBasePrice;

  const priceDelta = Number(variant.priceDelta ?? 0);
  if (!Number.isFinite(priceDelta)) return safeBasePrice;

  if ((variant.combinationId || variant.sku || variant.model) && priceDelta > 0) {
    return priceDelta;
  }

  if (variant.pricePrefix === '-') {
    return Math.max(0, safeBasePrice - priceDelta);
  }

  return safeBasePrice + priceDelta;
};

const variantHasPrice = (variant: ProductVariant) => Number.isFinite(Number(variant.priceDelta));

const variantIsAvailable = (variant: ProductVariant) =>
  variant.quantity === undefined || variant.quantity === null || variant.quantity > 0;

const variantHasFinalPrice = (variant: ProductVariant) =>
  Boolean(variant.combinationId || variant.sku || variant.model) && Number(variant.priceDelta ?? 0) > 0;

const getBuyablePricedVariants = (variants: ProductVariant[] = []) => {
  const pricedVariants = variants.filter(variantHasPrice);
  const availablePricedVariants = pricedVariants.filter(variantIsAvailable);
  const candidateVariants = availablePricedVariants.length > 0 ? availablePricedVariants : pricedVariants;
  const finalPricedVariants = candidateVariants.filter(variantHasFinalPrice);

  return finalPricedVariants.length > 0 ? finalPricedVariants : candidateVariants;
};

const colorOptionNames = ['culoare', 'color'];
const preferredDimensionNames = ['dimensiune', 'marime', 'diametru', 'size'];
const packageOptionNames = ['ambalaj', 'pachet', 'set'];
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
];

const normalizeProductOptions = (product: Product): ProductOption[] => {
  const apiOptions = Array.isArray(product.options)
    ? product.options
    : product.options
      ? [product.options]
      : [];
  const options = apiOptions
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

  if (options.length > 0) {
    return options;
  }

  return [];
};

const optionMatchesNames = (option: ProductOption, preferredNames: string[]) =>
  preferredNames.some((name) => option.name.toLowerCase().includes(name));

const getPurchaseOptionValueCounts = (product: Product) =>
  normalizeProductOptions(product).map((option) => option.values.length);

const getUniqueVariantSkus = (product: Product) =>
  Array.from(
    new Set(
      getBuyablePricedVariants(product.variants)
        .map((variant) => String(variant.sku || '').trim())
        .filter(Boolean),
    ),
  );

const hasSelectablePurchaseVariations = (product: Product) => {
  const hasMultipleOptionChoices = getPurchaseOptionValueCounts(product).some((count) => count > 1);
  const hasMultipleVariantSkus = getUniqueVariantSkus(product).length > 1;

  return hasMultipleOptionChoices || hasMultipleVariantSkus;
};

const getAutomaticCartSku = (product: Product) => getUniqueVariantSkus(product)[0] ?? product.sku ?? null;

const getCatalogPriceInfo = (product: Product) => {
  const basePrice = Number(product.price);
  const safeBasePrice = Number.isFinite(basePrice) ? basePrice : 0;
  const variantPrices = getBuyablePricedVariants(product.variants)
    .map((variant) => applyVariantPrice(safeBasePrice, variant))
    .filter(Number.isFinite);

  if (variantPrices.length === 0) {
    return {
      amount: safeBasePrice,
      hasFromLabel: false,
    };
  }

  return {
    amount: Math.min(...variantPrices),
    hasFromLabel: hasSelectablePurchaseVariations(product),
  };
};

const getAllProductOptionTags = (product: Product) =>
  normalizeProductOptions(product).flatMap((option) =>
    option.values.map((value) => `${option.name}: ${value}`),
  );

const productSearchText = (product: Product) =>
  `${product.name} ${product.description ?? ''} ${getAllProductOptionTags(product).join(' ')} ${(product.attributes || [])
    .map((attribute) => `${attribute.key}: ${attribute.value}`)
    .join(' ')}`.toLowerCase();

const textMatchesTerm = (text: string, term: string) =>
  new RegExp(`(^|[^a-z0-9])${term}([^a-z0-9]|$)`, 'i').test(text);

const getTextColorValues = (product: Product) =>
  textColorOptions
    .filter((color) => color.terms.some((term) => textMatchesTerm(productSearchText(product), term)))
    .map((color) => color.label);

const getTextDimensionValues = (product: Product) =>
  Array.from(
    new Set(
      Array.from(productSearchText(product).matchAll(/\b\d+(?:[.,]\d+)?\s?(?:mm|cm|m)\b/gi)).map(
        ([value]) => value.replace(/\s+/g, '').replace(',', '.'),
      ),
    ),
  );

const getTextPackageValues = (product: Product) =>
  Array.from(
    new Set(
      Array.from(
        productSearchText(product).matchAll(/\b\d+(?:[.,]\d+)?\s?(?:kg|g|gr|gram|grame)\b/gi),
      ).map(([value]) =>
        value
          .replace(/\s+/g, '')
          .replace(',', '.')
          .replace(/grame?$/i, 'g')
          .replace(/gr$/i, 'g')
          .toLowerCase(),
      ),
    ),
  );

const getProductFacetValues = (product: Product, preferredNames: string[]) => {
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
        : preferredNames === packageOptionNames
          ? getTextPackageValues(product)
        : [];

  return Array.from(new Set([...structuredValues, ...textValues]))
    .filter(Boolean)
    .sort((left, right) => left.localeCompare(right, 'ro', { numeric: true }));
};

const getOptionValuesByName = (products: Product[], preferredNames: string[]) =>
  Array.from(
    new Set(products.flatMap((product) => getProductFacetValues(product, preferredNames))),
  ).sort((left, right) => left.localeCompare(right, 'ro', { numeric: true }));

const productMatchesFacetValues = (
  product: Product,
  selectedValues: string[],
  preferredNames: string[],
) => {
  if (selectedValues.length === 0) return true;

  const productValues = new Set(getProductFacetValues(product, preferredNames));
  return selectedValues.some((value) => productValues.has(value));
};

const buildCategoryGroups = (categories: Category[] = []): CategoryGroup[] => {
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

  const curatedRoots = curatedRootSlugs
    .map((slug) => categories.find((category) => category.slug === slug))
    .filter(Boolean) as Category[];

  const dynamicGroups = curatedRoots.map((root) => {
    const childOrder = curatedCategoryChildrenByRootSlug[root.slug] || [];
    const allowedChildSlugs = new Set(childOrder);
    const children = (childrenByParentId.get(root.id) || [])
      .filter((child) => allowedChildSlugs.has(child.slug) && (child.productCount ?? 0) > 0)
      .sort((left, right) => childOrder.indexOf(left.slug) - childOrder.indexOf(right.slug))
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
};

const productCategoryIdentity = (product: Product) => {
  const categories = product.categories || [];

  return {
    ids: new Set([
      ...(product.categoryId ? [product.categoryId] : []),
      ...categories.map((category) => category.id),
      ...(product.category?.id ? [product.category.id] : []),
    ]),
    slugs: new Set([
      ...categories.map((category) => category.slug).filter(Boolean),
      ...(product.category?.slug ? [product.category.slug] : []),
    ]),
  };
};

const productMatchesCategoryGroup = (
  product: Product,
  group: CategoryGroup,
  selectedSubcategory: string,
) => {
  const identity = productCategoryIdentity(product);

  if (selectedSubcategory !== 'Toate') {
    const child = group.children.find((item) => item.id === selectedSubcategory);
    if (!child) return false;

    return (
      child.categoryIds.some((id) => identity.ids.has(id)) ||
      child.categorySlugs.some((slug) => identity.slugs.has(slug))
    );
  }

  const candidates = group.children.length > 0 ? group.children : [group];

  return candidates.some(
    (candidate) =>
      candidate.categoryIds.some((id) => identity.ids.has(id)) ||
      candidate.categorySlugs.some((slug) => identity.slugs.has(slug)),
  );
};

function FilterGroup({
  title,
  options,
  selectedValues,
  onToggle,
}: {
  title: string;
  options: string[];
  selectedValues: string[];
  onToggle: (value: string) => void;
}) {
  const [isOpen, setIsOpen] = useState(false);

  if (options.length === 0) {
    return null;
  }

  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50">
      <button
        type="button"
        onClick={() => setIsOpen((current) => !current)}
        className="flex w-full cursor-pointer items-center justify-between gap-3 px-4 py-3 text-left"
        aria-expanded={isOpen}
      >
        <span className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">{title}</span>
        <span className={`text-slate-500 transition ${isOpen ? 'rotate-180' : ''}`}>⌄</span>
      </button>

      {isOpen ? (
        <div className="flex flex-col gap-2 border-t border-slate-200 px-4 py-3">
          {options.map((option) => {
            const checked = selectedValues.includes(option);
            return (
              <label key={option} className="flex cursor-pointer items-center gap-2 text-sm text-slate-700">
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={() => onToggle(option)}
                  className="h-4 w-4 cursor-pointer accent-indigo-600"
                />
                <span>{option}</span>
              </label>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}

function FavoriteButtonIcon({ filled = false }: { filled?: boolean }) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      className={`h-5 w-5 stroke-current stroke-2 ${filled ? 'fill-current' : 'fill-none'}`}
    >
      <path d="M12 20s-6.7-4.2-8.7-8.1A5.1 5.1 0 0 1 12 6a5.1 5.1 0 0 1 8.7 5.9C18.7 15.8 12 20 12 20Z" />
    </svg>
  );
}

export default function ProductsPage({ products, categories = [] }: ProductsPageProps) {
  const { addToCart, toggleFavorite, isFavorite } = useCart();
  const searchParams = useSearchParams();
  const categoryGroups = useMemo(() => buildCategoryGroups(categories), [categories]);
  const priceBounds = useMemo(() => {
    const prices = products.map((product) => getCatalogPriceInfo(product).amount).filter(Number.isFinite);
    if (prices.length === 0) {
      return { min: 0, max: 100 };
    }

    return {
      min: Math.floor(Math.min(...prices)),
      max: Math.ceil(Math.max(...prices)),
    };
  }, [products]);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('Toate');
  const [subcategory, setSubcategory] = useState('Toate');
  const [sort, setSort] = useState('featured');
  const [selectedColors, setSelectedColors] = useState<string[]>([]);
  const [selectedDimensions, setSelectedDimensions] = useState<string[]>([]);
  const [selectedPackages, setSelectedPackages] = useState<string[]>([]);
  const [minPrice, setMinPrice] = useState(priceBounds.min);
  const [maxPrice, setMaxPrice] = useState(priceBounds.max);
  const [currentPage, setCurrentPage] = useState(1);
  const [productsPerPage, setProductsPerPage] = useState(35);

  const selectedGroup = categoryGroups.find((group) => group.id === category) ?? categoryGroups[0];
  const categoryScopedProducts = useMemo(() => {
    return products.filter((product) => {
        if (category === 'Toate') return true;
        if (category === 'uncategorized') return product.categoryId == null;

        return productMatchesCategoryGroup(product, selectedGroup, subcategory);
      });
  }, [products, category, subcategory, selectedGroup]);
  const colorOptions = useMemo(
    () => getOptionValuesByName(categoryScopedProducts, colorOptionNames),
    [categoryScopedProducts],
  );
  const dimensionOptions = useMemo(
    () => getOptionValuesByName(categoryScopedProducts, preferredDimensionNames),
    [categoryScopedProducts],
  );
  const packageOptions = useMemo(
    () => getOptionValuesByName(categoryScopedProducts, packageOptionNames),
    [categoryScopedProducts],
  );

  const resetSideFilters = () => {
    setSelectedColors([]);
    setSelectedDimensions([]);
    setSelectedPackages([]);
    setMinPrice(priceBounds.min);
    setMaxPrice(priceBounds.max);
  };

  const toggleSelectedValue = (
    value: string,
    selectedValues: string[],
    setSelectedValues: (values: string[]) => void,
  ) => {
    if (selectedValues.includes(value)) {
      setSelectedValues(selectedValues.filter((item) => item !== value));
      return;
    }

    setSelectedValues([...selectedValues, value]);
  };

  useEffect(() => {
    const categoryParam = searchParams.get('category');
    const searchParam = searchParams.get('search');
    const timeout = window.setTimeout(() => {
      setSearch(searchParam ?? '');

      if (!categoryParam) {
        setCategory('Toate');
        setSubcategory('Toate');
        return;
      }

      const selectedMainGroup = categoryGroups.find((group) => group.id === categoryParam);
      if (selectedMainGroup) {
        setCategory(selectedMainGroup.id);
        setSubcategory('Toate');
        return;
      }

      const selectedChildGroup = categoryGroups.find((group) =>
        group.children.some((child) => child.id === categoryParam),
      );
      if (selectedChildGroup) {
        setCategory(selectedChildGroup.id);
        setSubcategory(categoryParam);
      }
    }, 0);

    return () => window.clearTimeout(timeout);
  }, [categoryGroups, searchParams]);

  const filteredProducts = useMemo(() => {
    return products
      .filter((product) => {
        return productSearchText(product).includes(search.toLowerCase());
      })
      .filter((product) => {
        if (category === 'Toate') return true;
        if (category === 'uncategorized') return product.categoryId == null;

        return productMatchesCategoryGroup(product, selectedGroup, subcategory);
      })
      .filter((product) => {
        const price = getCatalogPriceInfo(product).amount;
        return price >= minPrice && price <= maxPrice;
      })
      .filter((product) => {
        return (
          productMatchesFacetValues(product, selectedColors, colorOptionNames) &&
          productMatchesFacetValues(product, selectedDimensions, preferredDimensionNames) &&
          productMatchesFacetValues(product, selectedPackages, packageOptionNames)
        );
      })
      .sort((a, b) => {
        if (sort === 'price-asc') {
          return getCatalogPriceInfo(a).amount - getCatalogPriceInfo(b).amount;
        }
        if (sort === 'price-desc') {
          return getCatalogPriceInfo(b).amount - getCatalogPriceInfo(a).amount;
        }
        return a.id - b.id;
      });
  }, [products, search, category, subcategory, sort, selectedGroup, minPrice, maxPrice, selectedColors, selectedDimensions, selectedPackages]);

  const totalPages = Math.max(1, Math.ceil(filteredProducts.length / productsPerPage));
  const safeCurrentPage = Math.min(currentPage, totalPages);
  const pageStartIndex = (safeCurrentPage - 1) * productsPerPage;
  const paginatedProducts = filteredProducts.slice(pageStartIndex, pageStartIndex + productsPerPage);
  const displayStart = filteredProducts.length === 0 ? 0 : pageStartIndex + 1;
  const displayEnd = Math.min(pageStartIndex + productsPerPage, filteredProducts.length);
  const visiblePages = Array.from({ length: totalPages }, (_, index) => index + 1).filter((page) => {
    if (totalPages <= 5) return true;
    if (page === 1 || page === totalPages) return true;
    return Math.abs(page - safeCurrentPage) <= 1;
  });

  useEffect(() => {
    const timeout = window.setTimeout(() => setCurrentPage(1), 0);
    return () => window.clearTimeout(timeout);
  }, [search, category, subcategory, sort, minPrice, maxPrice, selectedColors, selectedDimensions, selectedPackages, productsPerPage]);

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      setSelectedColors((current) => current.filter((value) => colorOptions.includes(value)));
      setSelectedDimensions((current) => current.filter((value) => dimensionOptions.includes(value)));
      setSelectedPackages((current) => current.filter((value) => packageOptions.includes(value)));
    }, 0);

    return () => window.clearTimeout(timeout);
  }, [colorOptions, dimensionOptions, packageOptions]);

  useEffect(() => {
    if (currentPage <= totalPages) return;
    const timeout = window.setTimeout(() => setCurrentPage(totalPages), 0);
    return () => window.clearTimeout(timeout);
  }, [currentPage, totalPages]);

  return (
    <div className="space-y-8">
      <Card className="bg-slate-50 p-8 shadow-sm">
        <div className="sm:flex sm:items-end sm:justify-between sm:space-x-8">
          <div className="max-w-2xl">
            <p className="text-sm uppercase tracking-[0.3em] text-slate-500">Articole atent selectionate</p>
            <h1 className="mt-4 text-4xl font-semibold tracking-tight text-slate-900 sm:text-5xl">
              Cantitati en-gross
            </h1>
            <p className="mt-4 max-w-xl text-sm leading-7 text-slate-600 sm:text-base">
              Fiecare material este de calitate superioara, aduse din cele mai bune surse, pentru a te ajuta sa creezi orice iti imaginezi.
            </p>
          </div>
          <div className="mt-6 grid gap-3 sm:mt-0 sm:grid-cols-2">
            <Card className="rounded-3xl bg-white p-4 shadow-sm">
              <label className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">
                Cauta produse
              </label>
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Cauta in colectia noastra..."
                className="mt-3 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-slate-400 focus:bg-white"
              />
            </Card>
            <Card className="rounded-3xl bg-white p-4 shadow-sm">
              <label className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">
                Filtre
              </label>
              <div className="mt-3 space-y-3">
                <select
                  value={category}
                  onChange={(event) => {
                    setCategory(event.target.value);
                    setSubcategory('Toate');
                  }}
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-slate-400 focus:bg-white"
                >
                  {categoryGroups.map((group) => (
                    <option key={group.id} value={group.id}>
                      {group.label}
                    </option>
                  ))}
                </select>
                {selectedGroup.children.length > 0 ? (
                  <select
                    value={subcategory}
                    onChange={(event) => setSubcategory(event.target.value)}
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-slate-400 focus:bg-white"
                  >
                    <option value="Toate">Toate {selectedGroup.label[0].toLowerCase() + selectedGroup.label.slice(1)}</option>
                    {selectedGroup.children.map((child) => (
                      <option key={child.id} value={String(child.id)}>
                        {child.label}
                      </option>
                    ))}
                  </select>
                ) : null}
                <select
                  value={sort}
                  onChange={(event) => setSort(event.target.value)}
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-slate-400 focus:bg-white"
                >
                  <option value="featured">Sorteaza</option>
                  <option value="price-asc">Pret: de la Mic la Mare</option>
                  <option value="price-desc">Pret: de la Mare la Mic</option>
                </select>
              </div>
            </Card>
          </div>
        </div>
      </Card>

      <section className="grid gap-6 lg:grid-cols-[17rem_1fr]">
        <aside className="h-fit rounded-3xl border border-slate-200 bg-white p-5 shadow-sm lg:sticky lg:top-24">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-sm font-semibold uppercase tracking-[0.24em] text-slate-600">Filtre</h2>
            <button
              type="button"
              onClick={resetSideFilters}
              className="cursor-pointer rounded-full border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 shadow-sm transition hover:border-slate-400 hover:bg-slate-100 hover:text-slate-900"
            >
              Reset
            </button>
          </div>

          <div className="mt-5 flex flex-col gap-4">
            <FilterGroup
              title="Culoare"
              options={colorOptions}
              selectedValues={selectedColors}
              onToggle={(value) => toggleSelectedValue(value, selectedColors, setSelectedColors)}
            />

            <FilterGroup
              title="Dimensiune"
              options={dimensionOptions}
              selectedValues={selectedDimensions}
              onToggle={(value) => toggleSelectedValue(value, selectedDimensions, setSelectedDimensions)}
            />

            <FilterGroup
              title="Ambalaj"
              options={packageOptions}
              selectedValues={selectedPackages}
              onToggle={(value) => toggleSelectedValue(value, selectedPackages, setSelectedPackages)}
            />

            <div className="flex flex-col gap-3 border-t border-slate-200 pt-4">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Pret</p>
              <div className="flex flex-col gap-2">
                <input
                  type="range"
                  step={priceStep}
                  min={priceBounds.min}
                  max={priceBounds.max}
                  value={minPrice}
                  onChange={(event) => {
                    const value = roundToPriceStep(Number(event.target.value));
                    setMinPrice(Math.min(value, maxPrice));
                  }}
                  className="cursor-pointer accent-indigo-600"
                  aria-label="Pret minim"
                />
                <input
                  type="range"
                  step={priceStep}
                  min={priceBounds.min}
                  max={priceBounds.max}
                  value={maxPrice}
                  onChange={(event) => {
                    const value = roundToPriceStep(Number(event.target.value));
                    setMaxPrice(Math.max(value, minPrice));
                  }}
                  className="cursor-pointer accent-indigo-600"
                  aria-label="Pret maxim"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <label className="flex flex-col gap-1">
                  <span className="text-xs text-slate-500">Min</span>
                  <div className="flex items-center rounded-xl border border-slate-200 bg-slate-50 px-3 focus-within:border-slate-400 focus-within:bg-white">
                    <input
                      type="number"
                      step={priceStep}
                      min={priceBounds.min}
                      max={maxPrice}
                      value={minPrice.toFixed(2)}
                      onChange={(event) => {
                        const value = roundToPriceStep(Number(event.target.value));
                        setMinPrice(Math.min(value, maxPrice));
                      }}
                      className="min-w-0 flex-1 bg-transparent py-2 text-sm text-slate-900 outline-none"
                    />
                    <span className="text-xs font-semibold text-slate-500">lei</span>
                  </div>
                </label>
                <label className="flex flex-col gap-1">
                  <span className="text-xs text-slate-500">Max</span>
                  <div className="flex items-center rounded-xl border border-slate-200 bg-slate-50 px-3 focus-within:border-slate-400 focus-within:bg-white">
                    <input
                      type="number"
                      step={priceStep}
                      min={minPrice}
                      max={priceBounds.max}
                      value={maxPrice.toFixed(2)}
                      onChange={(event) => {
                        const value = roundToPriceStep(Number(event.target.value));
                        setMaxPrice(Math.max(value, minPrice));
                      }}
                      className="min-w-0 flex-1 bg-transparent py-2 text-sm text-slate-900 outline-none"
                    />
                    <span className="text-xs font-semibold text-slate-500">lei</span>
                  </div>
                </label>
              </div>
            </div>
          </div>
        </aside>

        <div>
          <div className="flex items-center justify-between gap-4 sm:flex-row sm:gap-0">
            <div>
              <p className="text-sm font-medium text-slate-500">{filteredProducts.length} produse in total</p>
            </div>
            <div className="flex items-center gap-2 text-sm text-slate-500">
              <label htmlFor="products-per-page" className="font-medium">
                Pe pagina
              </label>
              <select
                id="products-per-page"
                value={productsPerPage}
                onChange={(event) => setProductsPerPage(Number(event.target.value))}
                className="cursor-pointer rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 outline-none transition hover:bg-slate-50 focus:border-slate-400"
              >
                {pageSizeOptions.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </div>
          </div>

        <div className="mt-6 grid items-stretch gap-4 sm:grid-cols-2 lg:grid-cols-[repeat(auto-fill,minmax(15rem,1fr))]">
          {paginatedProducts.map((product) => {
            const favorited = isFavorite(product.id);
            const priceInfo = getCatalogPriceInfo(product);
            const shouldSelectVariations = hasSelectablePurchaseVariations(product);
            const cartSku = getAutomaticCartSku(product);
            return (
            <Card key={product.id} className="flex h-full w-full flex-col overflow-hidden rounded-[2rem] border-slate-200 transition hover:-translate-y-1 hover:shadow-md">
              <div className="relative">
                <Link href={`/products/${product.id}`} className="group block">
                  <div className="flex h-72 items-center justify-center bg-slate-100 sm:h-65">
                    {product.imageUrl ? (
                      <Image
                        src={product.imageUrl}
                        alt={product.name}
                        width={640}
                        height={640}
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
                <button
                  type="button"
                  aria-label={`Adauga ${product.name} la favorite`}
                  onClick={(event) =>
                    toggleFavorite(
                      {
                        id: product.id,
                        name: product.name,
                        price: product.price,
                        imageUrl: product.imageUrl,
                      },
                      event.currentTarget,
                    )
                  }
                  className={`absolute right-2 top-2 z-10 inline-flex h-8 w-8 cursor-pointer items-center justify-center transition hover:scale-110 ${
                    favorited ? 'text-rose-600' : 'text-rose-500'
                  } rounded-2xl border border-slate-200 bg-white/95 shadow-sm hover:bg-white`}
                >
                  <FavoriteButtonIcon filled={favorited} />
                </button>
              </div>
              <div className="flex flex-1 flex-col space-y-3 p-4">
                <div className="space-y-1.5">
                  <Link
                    href={`/products/${product.id}`}
                    className="line-clamp-2 min-h-[3.5rem] text-base font-semibold text-slate-900 transition hover:text-indigo-600"
                  >
                    {product.name}
                  </Link>
                </div>
              </div>
              <div className="flex items-center justify-between gap-2 border-t border-slate-200 px-4 py-6">
                <div className="flex min-w-0 flex-col">
                  {priceInfo.hasFromLabel ? (
                    <span className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                      De la
                    </span>
                  ) : null}
                  <p className="text-2xl font-semibold leading-tight text-slate-900">
                    {numberFormatter.format(priceInfo.amount)}
                  </p>
                </div>
                {shouldSelectVariations ? (
                  <Link
                    href={`/products/${product.id}`}
                    className="inline-flex h-9 shrink-0 cursor-pointer items-center justify-center rounded-xl bg-indigo-600 px-4 text-xs font-semibold text-white transition hover:bg-indigo-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 focus-visible:ring-offset-2"
                  >
                    Vezi produsul
                  </Link>
                ) : (
                  <Button
                    className="h-9 shrink-0 rounded-xl px-4 text-xs"
                    onClick={(event) =>
                      addToCart(
                        {
                          id: product.id,
                          name: product.name,
                          price: priceInfo.amount.toFixed(2),
                          imageUrl: product.imageUrl,
                          sku: cartSku,
                        },
                        event.currentTarget,
                      )
                    }
                  >
                    Adauga in cos
                  </Button>
                )}
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
            <button
              type="button"
              onClick={() => setCurrentPage(1)}
              disabled={safeCurrentPage === 1}
              className="inline-flex h-8 min-w-8 cursor-pointer items-center justify-center rounded-md border border-slate-200 bg-white px-2 text-slate-500 transition hover:bg-slate-50 hover:text-slate-900 disabled:cursor-not-allowed disabled:opacity-40"
              aria-label="Prima pagina"
            >
              |‹
            </button>
            <button
              type="button"
              onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
              disabled={safeCurrentPage === 1}
              className="inline-flex h-8 min-w-8 cursor-pointer items-center justify-center rounded-md border border-slate-200 bg-white px-2 text-slate-500 transition hover:bg-slate-50 hover:text-slate-900 disabled:cursor-not-allowed disabled:opacity-40"
              aria-label="Pagina precedenta"
            >
              ‹
            </button>
            {visiblePages.map((page, index) => {
              const previousPage = visiblePages[index - 1];
              const showGap = previousPage != null && page - previousPage > 1;
              return (
                <span key={page} className="flex items-center gap-1">
                  {showGap ? <span className="px-1 text-slate-400">...</span> : null}
                  <button
                    type="button"
                    onClick={() => setCurrentPage(page)}
                    aria-current={page === safeCurrentPage ? 'page' : undefined}
                    className={`inline-flex h-8 min-w-8 cursor-pointer items-center justify-center rounded-md border px-2 transition ${
                      page === safeCurrentPage
                        ? 'border-[#7b4a75] bg-white text-[#7b4a75]'
                        : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                    }`}
                  >
                    {page}
                  </button>
                </span>
              );
            })}
            <button
              type="button"
              onClick={() => setCurrentPage((page) => Math.min(totalPages, page + 1))}
              disabled={safeCurrentPage === totalPages}
              className="inline-flex h-8 min-w-8 cursor-pointer items-center justify-center rounded-md border border-slate-200 bg-white px-2 text-slate-500 transition hover:bg-slate-50 hover:text-slate-900 disabled:cursor-not-allowed disabled:opacity-40"
              aria-label="Pagina urmatoare"
            >
              ›
            </button>
            <button
              type="button"
              onClick={() => setCurrentPage(totalPages)}
              disabled={safeCurrentPage === totalPages}
              className="inline-flex h-8 min-w-8 cursor-pointer items-center justify-center rounded-md border border-slate-200 bg-white px-2 text-slate-500 transition hover:bg-slate-50 hover:text-slate-900 disabled:cursor-not-allowed disabled:opacity-40"
              aria-label="Ultima pagina"
            >
              ›|
            </button>
          </div>
        </div>
        </div>
      </section>
    </div>
  );
}
