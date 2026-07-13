'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useCart } from '@/components/cart-provider';
import { Button } from '@/components/ui/button';

const currencyFormatter = new Intl.NumberFormat('ro-RO', {
  style: 'currency',
  currency: 'RON',
  currencyDisplay: 'narrowSymbol',
});

function EmptyFavoritesIllustration() {
  return (
    <svg aria-hidden="true" viewBox="0 0 360 260" className="h-auto w-full max-w-[320px]">
      <rect x="42" y="174" width="276" height="18" rx="9" className="fill-slate-100" />
      <path
        d="M180 183s-88-54-111-105C50 36 101 10 135 45c16-31 74-31 90 0 34-35 85-9 66 33-23 51-111 105-111 105Z"
        className="fill-white stroke-slate-900"
        strokeWidth="8"
        strokeLinejoin="round"
      />
      <path
        d="M116 85c12-19 40-20 56 3"
        className="fill-none stroke-[#e11d48]"
        strokeWidth="8"
        strokeLinecap="round"
      />
      <circle cx="79" cy="54" r="7" className="fill-[#e11d48]" />
      <circle cx="282" cy="88" r="6" className="fill-[#e11d48]" />
      <circle cx="255" cy="159" r="5" className="fill-slate-300" />
    </svg>
  );
}

function EmptyFavoritesState() {
  return (
    <section className="mx-auto grid max-w-[1100px] items-center gap-10 rounded-[2rem] border border-slate-200 bg-white px-6 py-10 shadow-sm sm:px-10 lg:grid-cols-[minmax(0,1fr)_22rem] lg:py-14">
      <div className="space-y-6">
        <div className="inline-flex min-h-10 items-center rounded-full border border-rose-200 bg-rose-50 px-4 text-sm font-semibold text-rose-700">
          Lista este goala
        </div>
        <div className="space-y-4">
          <h1 className="text-4xl font-semibold tracking-tight text-slate-900 sm:text-5xl">
            Pastreaza aici produsele preferate
          </h1>
          <p className="max-w-xl text-base leading-7 text-slate-600 sm:text-lg">
            Apasa pe inimioara de pe un produs ca sa il salvezi pentru mai tarziu.
            Favoritele tale vor ramane aici si dupa ce revii pe site.
          </p>
        </div>
        <Link
          href="/catalog"
          className="inline-flex min-h-12 items-center justify-center rounded-2xl bg-slate-900 px-6 py-3 text-base font-semibold text-white transition hover:bg-black"
        >
          Vezi catalogul
        </Link>
      </div>

      <div className="flex justify-center rounded-[2rem] bg-slate-50 px-6 py-8">
        <EmptyFavoritesIllustration />
      </div>
    </section>
  );
}

function TrashIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className="h-5 w-5 fill-none stroke-current stroke-2">
      <path d="M4 7h16" />
      <path d="M10 11v6M14 11v6" />
      <path d="M6 7l1 14h10l1-14" />
      <path d="M9 7V4h6v3" />
    </svg>
  );
}

export default function FavoritesPageContent() {
  const { favoriteItems, favoriteCount, removeFromFavorites, addToCart } = useCart();

  return (
    <main className="px-6 py-10 sm:px-10 lg:px-16">
      {favoriteItems.length === 0 ? (
        <EmptyFavoritesState />
      ) : (
        <section className="mx-auto max-w-[1200px] space-y-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.24em] text-rose-600">
                Favorite
              </p>
              <h1 className="mt-3 text-4xl font-semibold tracking-tight text-slate-900 sm:text-5xl">
                Produsele tale favorite
              </h1>
              <p className="mt-3 text-base text-slate-600">
                Ai salvat {favoriteCount} {favoriteCount === 1 ? 'produs' : 'produse'} pentru mai tarziu.
              </p>
            </div>
            <Link
              href="/catalog"
              className="inline-flex min-h-11 items-center justify-center rounded-2xl border border-slate-300 bg-white px-5 text-sm font-semibold text-slate-900 transition hover:bg-slate-50"
            >
              Continua cumparaturile
            </Link>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {favoriteItems.map((item) => (
              <article
                key={item.product.id}
                className="flex h-full flex-col overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-md"
              >
                <Link href={`/products/${item.product.id}`} className="group relative block h-72 bg-slate-100">
                  {item.product.imageUrl ? (
                    <Image
                      src={item.product.imageUrl}
                      alt={item.product.name}
                      fill
                      className="object-cover transition duration-300 group-hover:scale-105"
                      unoptimized
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center text-sm text-slate-500">
                      Imagine indisponibila
                    </div>
                  )}
                </Link>

                <div className="flex flex-1 flex-col gap-4 p-5">
                  <div className="space-y-2">
                    <Link
                      href={`/products/${item.product.id}`}
                      className="line-clamp-2 text-lg font-semibold leading-7 text-slate-900 transition hover:text-rose-600"
                    >
                      {item.product.name}
                    </Link>
                    <p className="text-2xl font-semibold tracking-tight text-slate-900">
                      {currencyFormatter.format(Number(item.product.price))}
                    </p>
                  </div>

                  <div className="mt-auto flex flex-wrap gap-2">
                    <Button
                      type="button"
                      onClick={(event) => addToCart(item.product, event.currentTarget)}
                      className="min-h-10 bg-slate-900 hover:bg-black"
                    >
                      Adauga in cos
                    </Button>
                    <button
                      type="button"
                      onClick={() => removeFromFavorites(item.product.id)}
                      aria-label={`Elimina ${item.product.name} din favorite`}
                      className="inline-flex h-10 w-10 cursor-pointer items-center justify-center rounded-2xl border border-rose-200 bg-white text-rose-600 transition hover:bg-rose-50 hover:text-rose-700"
                    >
                      <TrashIcon />
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </section>
      )}
    </main>
  );
}
