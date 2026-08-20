'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import type { CatalogPageProduct } from '@/components/catalog-page-product-groups';
import { getProductImageProps } from '@/lib/product-image-variants';
import { Skeleton } from '@/components/ui/skeleton';

type EmbeddedCatalogViewerProps = {
  eyebrow?: string;
  title: string;
  description: string;
  embedUrl: string;
  externalUrl: string;
  documentTitle: string;
  updatedLabel?: string;
  pageCount?: number;
  currentPage?: number;
  onPageChange?: (page: number) => void;
  products?: CatalogPageProduct[];
};

const priceFormatter = new Intl.NumberFormat('ro-RO', {
  style: 'currency',
  currency: 'RON',
  currencyDisplay: 'narrowSymbol',
});

function BookIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      className="h-5 w-5 fill-none stroke-current stroke-[1.7]"
    >
      <path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H11a1 1 0 0 1 1 1v16a3 3 0 0 0-3-3H4V5.5Z" />
      <path d="M20 5.5A2.5 2.5 0 0 0 17.5 3H13a1 1 0 0 0-1 1v16a3 3 0 0 1 3-3h5V5.5Z" />
    </svg>
  );
}

function PointerIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      className="h-6 w-6 fill-none stroke-current stroke-[1.7]"
    >
      <path d="M8.5 11V5.5a1.5 1.5 0 0 1 3 0V10" />
      <path d="M11.5 10V4.5a1.5 1.5 0 0 1 3 0V10" />
      <path d="M14.5 10V6a1.5 1.5 0 0 1 3 0v5" />
      <path d="M17.5 10V8.5a1.5 1.5 0 0 1 3 0v5.1c0 4.6-2.8 7.4-7.1 7.4h-.7a6 6 0 0 1-4.5-2L4 14.4a1.6 1.6 0 0 1 2.2-2.3l2.3 1.8" />
      <path d="m4 3 1.1 2.2L7.5 6 5.1 7 4 9.2 2.9 7 .5 6l2.4-.8L4 3Z" />
    </svg>
  );
}

function ShareIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      className="h-5 w-5 fill-none stroke-current stroke-[1.9]"
    >
      <path d="M12 4v10" />
      <path d="m8 8 4-4 4 4" />
      <path d="M5 12v5.5A2.5 2.5 0 0 0 7.5 20h9A2.5 2.5 0 0 0 19 17.5V12" />
    </svg>
  );
}

function CalendarIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      className="h-4 w-4 fill-none stroke-current stroke-[1.8]"
    >
      <path d="M7 3v4M17 3v4M4.5 9.5h15" />
      <path d="M6.5 5h11A2.5 2.5 0 0 1 20 7.5v10A2.5 2.5 0 0 1 17.5 20h-11A2.5 2.5 0 0 1 4 17.5v-10A2.5 2.5 0 0 1 6.5 5Z" />
    </svg>
  );
}

function ChevronIcon({ direction }: { direction: 'previous' | 'next' }) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      className="h-4 w-4 fill-none stroke-current stroke-2"
    >
      {direction === 'previous' ? <path d="m15 18-6-6 6-6" /> : <path d="m9 6 6 6-6 6" />}
    </svg>
  );
}

export default function EmbeddedCatalogViewer({
  eyebrow = 'Catalog digital',
  title,
  description,
  embedUrl,
  externalUrl,
  documentTitle,
  updatedLabel,
  pageCount,
  currentPage = 1,
  onPageChange,
  products = [],
}: EmbeddedCatalogViewerProps) {
  const safePageCount = pageCount ?? 1;
  const [loadedEmbedUrl, setLoadedEmbedUrl] = useState('');
  const isFrameLoading = loadedEmbedUrl !== embedUrl;

  return (
    <section
      aria-labelledby="digital-catalog-title"
      className="overflow-hidden rounded-[1.75rem] border border-slate-200 bg-white shadow-[0_24px_70px_rgba(40,16,36,0.08)]"
    >
      <div className="animate-hero-item border-b border-slate-100 px-5 py-7 sm:px-8 sm:py-9 lg:px-10">
        <p className="text-xs font-bold uppercase tracking-[0.26em] text-violet-600">
          {eyebrow}
        </p>
        <h1
          id="digital-catalog-title"
          className="mt-3 text-3xl font-bold tracking-[-0.035em] text-slate-950 sm:text-4xl lg:text-5xl"
        >
          {title}
        </h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600 sm:text-base">
          {description}
        </p>
      </div>

      <div className="grid lg:grid-cols-[minmax(0,1fr)_22rem]">
        <div className="bg-[radial-gradient(circle_at_top,#fbf4f9_0%,#f8fafc_42%,#f1f5f9_100%)] p-3 sm:p-6 lg:p-8">
          <div className="animate-hero-image relative mx-auto aspect-[794/1123] w-full max-w-[46rem] overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_18px_45px_rgba(15,23,42,0.12)]">
            <iframe
              key={embedUrl}
              title={documentTitle}
              src={embedUrl}
              className="block h-full w-full border-0"
              loading="eager"
              allow="fullscreen"
              allowFullScreen
              onLoad={() => setLoadedEmbedUrl(embedUrl)}
            />
            {isFrameLoading ? <CatalogFrameSkeleton /> : null}
            <span
              aria-hidden="true"
              className="absolute left-0 top-1/2 z-10 h-24 w-16 -translate-y-1/2 cursor-default bg-transparent"
            />
            <span
              aria-hidden="true"
              className="absolute right-0 top-1/2 z-10 h-24 w-16 -translate-y-1/2 cursor-default bg-transparent"
            />
          </div>
        </div>

        <aside className="animate-hero-item flex flex-col justify-between gap-8 border-t border-slate-200 bg-white p-6 sm:p-8 lg:border-l lg:border-t-0" style={{ animationDelay: '120ms' }}>
          <div className="space-y-7">
            <div className="flex items-center gap-6 text-xs font-medium text-slate-600">
              {updatedLabel ? (
                <span className="inline-flex items-center gap-2">
                  <CalendarIcon />
                  {updatedLabel}
                </span>
              ) : null}
              <span className="inline-flex items-center gap-2">
                <BookIcon />
                {pageCount ? `${pageCount} pagini` : 'Catalog complet'}
              </span>
            </div>

            <div className="h-px bg-slate-200" />

            {pageCount ? (
              <div className="flex items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-3">
                <button
                  type="button"
                  onClick={() => onPageChange?.(Math.max(1, currentPage - 1))}
                  disabled={currentPage <= 1}
                  className="inline-flex h-10 w-10 cursor-pointer items-center justify-center rounded-full border border-slate-200 bg-white text-slate-700 transition hover:border-violet-300 hover:bg-violet-50 disabled:cursor-not-allowed disabled:opacity-40"
                  aria-label="Pagina anterioara"
                >
                  <ChevronIcon direction="previous" />
                </button>
                <p className="text-center text-sm font-bold text-slate-950">
                  {String(currentPage).padStart(2, '0')} / {String(safePageCount).padStart(2, '0')}
                </p>
                <button
                  type="button"
                  onClick={() => onPageChange?.(Math.min(safePageCount, currentPage + 1))}
                  disabled={currentPage >= safePageCount}
                  className="inline-flex h-10 w-10 cursor-pointer items-center justify-center rounded-full border border-slate-200 bg-white text-slate-700 transition hover:border-violet-300 hover:bg-violet-50 disabled:cursor-not-allowed disabled:opacity-40"
                  aria-label="Pagina urmatoare"
                >
                  <ChevronIcon direction="next" />
                </button>
              </div>
            ) : null}

            <div className="h-px bg-slate-200" />

            <div className="flex gap-3 text-slate-600">
              <span className="mt-0.5 shrink-0 text-violet-700">
                <PointerIcon />
              </span>
              <p className="text-sm leading-6">
                Pentru ca produsele din dreapta sa se actualizeze, schimba pagina din comenzile
                de aici. Categoriile si linkurile din catalogul Canva raman disponibile.
              </p>
            </div>

            <SidebarPageProducts currentPage={currentPage} products={products} />
          </div>

          <div className="space-y-3">
            <ShareCatalogButton documentTitle={documentTitle} fallbackUrl={externalUrl} />
            <a
              href={externalUrl}
              target="_blank"
              rel="noreferrer noopener"
              className="grid min-h-12 w-full grid-cols-[1.25rem_minmax(0,1fr)_1.25rem] items-center gap-2 rounded-xl border border-violet-300 bg-white px-4 py-3 text-center text-sm font-bold text-violet-700 transition hover:border-violet-600 hover:bg-violet-50"
            >
              <BookIcon />
              <span>Deschide catalogul</span>
              <span aria-hidden="true" />
            </a>
          </div>
        </aside>
      </div>
    </section>
  );
}

function CatalogFrameSkeleton() {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 z-20 flex flex-col bg-white p-5"
    >
      <div className="h-full rounded-xl bg-slate-100 p-6">
        <Skeleton className="mb-8 h-4 w-28 rounded-full" />
        <Skeleton className="mb-4 h-8 w-2/3 rounded-full" />
        <Skeleton className="mb-10 h-4 w-1/2 rounded-full" />
        <div className="grid flex-1 grid-cols-2 gap-4">
          <div className="space-y-4">
            <Skeleton className="h-40 rounded-2xl" />
            <Skeleton className="h-28 rounded-2xl" />
            <div className="grid grid-cols-2 gap-3">
              <Skeleton className="h-20 rounded-xl" />
              <Skeleton className="h-20 rounded-xl" />
            </div>
          </div>
          <div className="space-y-4">
            <Skeleton className="h-32 rounded-2xl" />
            <div className="grid grid-cols-2 gap-3">
              <Skeleton className="h-28 rounded-xl" />
              <Skeleton className="h-28 rounded-xl" />
            </div>
            <Skeleton className="h-36 rounded-2xl" />
          </div>
        </div>
      </div>
      <span className="sr-only">Se incarca catalogul.</span>
    </div>
  );
}

function ShareCatalogButton({
  documentTitle,
  fallbackUrl,
}: {
  documentTitle: string;
  fallbackUrl: string;
}) {
  const [feedback, setFeedback] = useState('');

  async function handleShare() {
    const shareUrl = typeof window !== 'undefined' ? window.location.href : fallbackUrl;
    const shareData = {
      title: documentTitle,
      text: 'Rasfoieste catalogul digital Margele.net.',
      url: shareUrl,
    };

    try {
      if (navigator.share) {
        await navigator.share(shareData);
        return;
      }

      await navigator.clipboard.writeText(shareUrl);
      setFeedback('Link copiat');
      window.setTimeout(() => setFeedback(''), 2200);
    } catch {
      setFeedback('Nu am putut copia linkul');
      window.setTimeout(() => setFeedback(''), 2200);
    }
  }

  return (
    <div>
      <button
        type="button"
        onClick={handleShare}
        className="grid min-h-12 w-full cursor-pointer grid-cols-[1.25rem_minmax(0,1fr)_1.25rem] items-center gap-2 rounded-xl bg-violet-700 px-4 py-3 text-center text-sm font-bold text-white transition hover:bg-violet-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400 focus-visible:ring-offset-2"
      >
        <ShareIcon />
        <span>Trimite unui prieten</span>
        <span aria-hidden="true" />
      </button>
      {feedback ? (
        <p aria-live="polite" className="mt-2 text-center text-xs font-semibold text-violet-700">
          {feedback}
        </p>
      ) : null}
    </div>
  );
}

function SidebarPageProducts({
  currentPage,
  products,
}: {
  currentPage: number;
  products: CatalogPageProduct[];
}) {
  if (products.length === 0) {
    return null;
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-3">
        <span aria-hidden="true" />
        <Link
          href="/catalog"
          className="text-xs font-bold text-violet-700 transition hover:text-violet-950"
        >
          Toate
        </Link>
      </div>

      <div className="space-y-3">
        {products.map((product) => (
          <SidebarProductCard key={`${currentPage}-${product.id}`} product={product} />
        ))}
      </div>
    </div>
  );
}

function SidebarProductCard({ product }: { product: CatalogPageProduct }) {
  const priceAmount = Number(product.displayPrice ?? product.price);
  const safePrice = Number.isFinite(priceAmount) ? priceAmount : 0;

  return (
    <Link
      href={`/products/${product.id}`}
      className="group grid min-h-24 grid-cols-[5.75rem_minmax(0,1fr)] overflow-hidden rounded-lg border border-slate-200 bg-white text-left transition hover:-translate-y-0.5 hover:border-violet-200 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400 focus-visible:ring-offset-2"
    >
      <div className="relative h-full min-h-24 bg-slate-50">
        {product.imageUrl ? (
          <Image
            {...getProductImageProps(product.imageUrl, 'thumb')}
            alt={product.name}
            className="h-full w-full object-cover object-center transition duration-300 group-hover:scale-[1.03]"
            unoptimized
          />
        ) : (
          <div className="flex h-full items-center justify-center px-2 text-center text-xs font-medium text-slate-400">
            Imagine indisponibila
          </div>
        )}
      </div>

      <div className="flex min-w-0 flex-col justify-between gap-2 p-3">
        <p className="line-clamp-2 text-xs font-bold leading-5 text-slate-950 transition group-hover:text-violet-800">
          {product.name}
        </p>
        <p className="text-sm font-bold text-slate-950">
          {product.hasFromPrice ? <span className="mr-1 text-xs font-semibold text-slate-500">De la</span> : null}
          {priceFormatter.format(safePrice)}
        </p>
      </div>
    </Link>
  );
}
