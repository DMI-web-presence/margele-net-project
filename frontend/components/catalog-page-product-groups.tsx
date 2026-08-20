'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useMemo, useState } from 'react';
import { getProductImageProps } from '@/lib/product-image-variants';

export type CatalogPageProduct = {
  id: number;
  name: string;
  price: string;
  displayPrice?: string | number | null;
  hasFromPrice?: boolean;
  imageUrl: string | null;
  category?: { name: string } | null;
  categories?: Array<{ name: string }>;
};

export type CatalogProductGroup = {
  page: number;
  products: CatalogPageProduct[];
};

type CatalogPageProductGroupsProps = {
  groups: CatalogProductGroup[];
  currentPage?: number;
  onPageChange?: (page: number) => void;
};

const priceFormatter = new Intl.NumberFormat('ro-RO', {
  style: 'currency',
  currency: 'RON',
  currencyDisplay: 'narrowSymbol',
});

export default function CatalogPageProductGroups({
  groups,
  currentPage: controlledCurrentPage,
  onPageChange,
}: CatalogPageProductGroupsProps) {
  const [localCurrentPage, setLocalCurrentPage] = useState(1);
  const currentPage = controlledCurrentPage ?? localCurrentPage;
  const selectedGroup = useMemo(
    () => groups.find((group) => group.page === currentPage) ?? groups[0],
    [currentPage, groups],
  );

  if (!selectedGroup) {
    return null;
  }

  const firstPage = groups[0].page;
  const lastPage = groups[groups.length - 1].page;
  const selectedGroupIndex = groups.findIndex((group) => group.page === selectedGroup.page);
  const previousPage = groups[Math.max(0, selectedGroupIndex - 1)].page;
  const nextPage = groups[Math.min(groups.length - 1, selectedGroupIndex + 1)].page;

  function setCurrentPage(page: number) {
    setLocalCurrentPage(page);
    onPageChange?.(page);
  }

  return (
    <section className="mt-10 space-y-5" aria-labelledby="catalog-page-products-title">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-violet-700">
            Catalog digital
          </p>
          <h2 id="catalog-page-products-title" className="mt-2 text-2xl font-bold text-slate-950">
            Produse de pe pagini
          </h2>
        </div>
        <Link
          href="/catalog"
          className="text-sm font-bold text-violet-700 transition hover:text-violet-950"
        >
          Vezi toate produsele
        </Link>
      </div>

      <article className="rounded-2xl border border-slate-200 bg-white p-4 shadow-[0_16px_42px_rgba(15,23,42,0.06)] sm:p-5">
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-950">
              Produse de pe pagina {String(selectedGroup.page).padStart(2, '0')}
            </h3>
            <p className="mt-1 text-xs font-semibold text-slate-500">
              {selectedGroup.products.length} produse
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setCurrentPage(previousPage)}
              disabled={selectedGroup.page === firstPage}
              className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 text-slate-700 transition hover:border-violet-300 hover:bg-violet-50 disabled:cursor-not-allowed disabled:opacity-40"
              aria-label="Pagina anterioara"
            >
              <span aria-hidden="true">‹</span>
            </button>
            <span className="min-w-24 text-center text-sm font-bold text-slate-950">
              {String(selectedGroup.page).padStart(2, '0')} / {String(lastPage).padStart(2, '0')}
            </span>
            <button
              type="button"
              onClick={() => setCurrentPage(nextPage)}
              disabled={selectedGroup.page === lastPage}
              className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 text-slate-700 transition hover:border-violet-300 hover:bg-violet-50 disabled:cursor-not-allowed disabled:opacity-40"
              aria-label="Pagina urmatoare"
            >
              <span aria-hidden="true">›</span>
            </button>
          </div>
        </div>

        {selectedGroup.products.length > 0 ? (
          <div className="grid gap-3 md:grid-cols-3">
            {selectedGroup.products.map((product) => (
              <CatalogMiniProductCard key={`${selectedGroup.page}-${product.id}`} product={product} />
            ))}
          </div>
        ) : (
          <div className="rounded-lg border border-dashed border-slate-200 bg-slate-50 px-4 py-5 text-sm font-semibold text-slate-500">
            Produsele pentru aceasta pagina vor fi asociate manual.
          </div>
        )}
      </article>
    </section>
  );
}

function CatalogMiniProductCard({ product }: { product: CatalogPageProduct }) {
  const priceAmount = Number(product.displayPrice ?? product.price);
  const safePrice = Number.isFinite(priceAmount) ? priceAmount : 0;

  return (
    <Link
      href={`/products/${product.id}`}
      className="group grid min-h-[6.25rem] grid-cols-[7.5rem_minmax(0,1fr)] overflow-hidden rounded-lg border border-slate-200 bg-white text-left transition hover:-translate-y-0.5 hover:border-violet-200 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400 focus-visible:ring-offset-2"
    >
      <div className="relative h-full min-h-[6.25rem] bg-slate-50">
        {product.imageUrl ? (
          <Image
            {...getProductImageProps(product.imageUrl, 'thumb')}
            alt={product.name}
            className="h-full w-full object-cover object-center transition duration-300 group-hover:scale-[1.03]"
            unoptimized
          />
        ) : (
          <div className="flex h-full items-center justify-center px-3 text-center text-xs font-medium text-slate-400">
            Imagine indisponibila
          </div>
        )}
      </div>

      <div className="flex min-w-0 flex-col justify-between gap-3 p-3">
        <p className="line-clamp-2 text-xs font-bold leading-5 text-slate-950 transition group-hover:text-violet-800">
          {product.name}
        </p>
        <p className="text-base font-bold text-slate-950">
          {product.hasFromPrice ? <span className="mr-1 text-xs font-semibold text-slate-500">De la</span> : null}
          {priceFormatter.format(safePrice)}
        </p>
      </div>
    </Link>
  );
}
