'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import { useCart } from '@/components/cart-provider';
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

type ProductsPageProps = {
  products: Product[];
};

const numberFormatter = new Intl.NumberFormat('ro-RO', {
  style: 'currency',
  currency: 'RON',
  currencyDisplay: 'narrowSymbol',
});

const categoryDefinitions: Record<number, { label: string; parentId?: string }> = {
  1: { label: 'Craciun', parentId: 'event' },
  2: { label: 'pandandive' },
};

const parentCategoryLabels: Record<string, string> = {
  event: 'Articole pentru evenimente',
};

const categoryGroups = [
  { id: 'Toate', label: 'Toate categoriile', children: [] },
  {
    id: 'event',
    label: parentCategoryLabels.event,
    children: [{ id: 1, label: 'Craciun' }],
  },
  { id: '2', label: categoryDefinitions[2].label, children: [] },
  { id: 'uncategorized', label: 'Uncategorized', children: [] },
] as const;

const colorOptions = ['Toate culorile', 'Alb', 'Rosu', 'Verde', 'Auriu', 'Argintiu', 'Natural'];
const dimensionOptions = ['Toate dimensiunile', '6.5 mm', '8.5 mm', '10.5 mm', '12.5 mm', '14.5 mm'];
const producerOptions = ['Toti producatorii', 'Margele.net', 'Degetar', 'Import'];
const priceStep = 0.5;

const roundToPriceStep = (value: number) => Math.round(value / priceStep) * priceStep;

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

export default function ProductsPage({ products }: ProductsPageProps) {
  const { addToCart, toggleFavorite, isFavorite } = useCart();
  const searchParams = useSearchParams();
  const priceBounds = useMemo(() => {
    const prices = products.map((product) => Number(product.price)).filter(Number.isFinite);
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
  const [selectedProducers, setSelectedProducers] = useState<string[]>([]);
  const [minPrice, setMinPrice] = useState(priceBounds.min);
  const [maxPrice, setMaxPrice] = useState(priceBounds.max);

  const selectedGroup = categoryGroups.find((group) => group.id === category) ?? categoryGroups[0];

  const resetSideFilters = () => {
    setSelectedColors([]);
    setSelectedDimensions([]);
    setSelectedProducers([]);
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
    const timeout = window.setTimeout(() => {
      if (!categoryParam) {
        setCategory('Toate');
        setSubcategory('Toate');
        return;
      }

      if (categoryParam === '1') {
        setCategory('event');
        setSubcategory('1');
        return;
      }

      if (categoryParam === 'event' || categoryParam === '2' || categoryParam === 'uncategorized') {
        setCategory(categoryParam);
        setSubcategory('Toate');
      }
    }, 0);

    return () => window.clearTimeout(timeout);
  }, [searchParams]);

  const filteredProducts = useMemo(() => {
    return products
      .filter((product) => {
        const text = `${product.name} ${product.description ?? ''}`.toLowerCase();
        return text.includes(search.toLowerCase());
      })
      .filter((product) => {
        if (category === 'Toate') return true;
        if (category === 'uncategorized') return product.categoryId == null;

        const productCategoryId = product.categoryId ?? 0;

        if (selectedGroup.children.length > 0) {
          if (subcategory === 'Toate') {
            return selectedGroup.children.some((child) => child.id === productCategoryId);
          }
          return productCategoryId === Number(subcategory);
        }

        return String(productCategoryId) === category;
      })
      .filter((product) => {
        const price = Number(product.price);
        return price >= minPrice && price <= maxPrice;
      })
      .filter((product) => {
        const text = `${product.name} ${product.description ?? ''}`.toLowerCase();
        const matchesColor =
          selectedColors.length === 0 ||
          selectedColors.some((value) => text.includes(value.toLowerCase()));
        const matchesDimension =
          selectedDimensions.length === 0 ||
          selectedDimensions.some((value) => text.includes(value.toLowerCase()));
        const matchesProducer =
          selectedProducers.length === 0 ||
          selectedProducers.some((value) => text.includes(value.toLowerCase()));

        return matchesColor && matchesDimension && matchesProducer;
      })
      .sort((a, b) => {
        if (sort === 'price-asc') {
          return Number(a.price) - Number(b.price);
        }
        if (sort === 'price-desc') {
          return Number(b.price) - Number(a.price);
        }
        return a.id - b.id;
      });
  }, [products, search, category, subcategory, sort, selectedGroup, minPrice, maxPrice, selectedColors, selectedDimensions, selectedProducers]);

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
              options={colorOptions.slice(1)}
              selectedValues={selectedColors}
              onToggle={(value) => toggleSelectedValue(value, selectedColors, setSelectedColors)}
            />

            <FilterGroup
              title="Dimensiune"
              options={dimensionOptions.slice(1)}
              selectedValues={selectedDimensions}
              onToggle={(value) => toggleSelectedValue(value, selectedDimensions, setSelectedDimensions)}
            />

            <FilterGroup
              title="Producator"
              options={producerOptions.slice(1)}
              selectedValues={selectedProducers}
              onToggle={(value) => toggleSelectedValue(value, selectedProducers, setSelectedProducers)}
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
              <p className="text-sm font-medium text-slate-500">{filteredProducts.length} produse afisate</p>
            </div>
            <div className="text-sm text-slate-500">
              {/* {filteredProducts.length === 0 ? 'No products match your search.' : ` ${products.length} total products.`} */}
            </div>
          </div>

        <div className="mt-6 grid items-stretch justify-items-center gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {filteredProducts.map((product) => {
            const favorited = isFavorite(product.id);
            return (
            <Card key={product.id} className="flex h-full w-full max-w-[16rem] flex-col overflow-hidden rounded-[2rem] border-slate-200 transition hover:-translate-y-1 hover:shadow-md">
              <div className="relative">
                <Link href={`/products/${product.id}`} className="group block">
                  <div className="bg-slate-100">
                    {product.imageUrl ? (
                      <Image
                        src={product.imageUrl}
                        alt={product.name}
                        width={640}
                        height={640}
                        className="h-auto w-full object-contain transition duration-300 group-hover:scale-105"
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
                  }`}
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
                  <div className="flex items-center gap-1">
                    <p className="text-xs font-medium text-slate-900">Material: </p>
                    <p className="text-xs leading-5 text-slate-600">{product.description ?? 'High-quality craft material.'}</p>
                  </div>
                </div>
              </div>
              <div className="flex items-center justify-between gap-2 border-t border-slate-200 px-4 py-6">
                <p className="text-2xl font-semibold text-slate-900">{numberFormatter.format(Number(product.price))}</p>
                <div className="flex flex-col items-center gap-1.5">
                  <Link
                    href={`/products/${product.id}`}
                    className="inline-flex items-center rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-900 transition hover:bg-slate-100"
                  >
                    Detalii produs
                  </Link>
                  <Button
                    className="h-8 rounded-xl px-3 text-xs"
                    onClick={(event) =>
                      addToCart(
                        {
                          id: product.id,
                          name: product.name,
                          price: product.price,
                          imageUrl: product.imageUrl,
                        },
                        event.currentTarget,
                      )
                    }
                  >
                    Adauga in cos
                  </Button>
                </div>
              </div>
            </Card>
            );
          })}
        </div>
        </div>
      </section>
    </div>
  );
}
