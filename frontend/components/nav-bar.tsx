'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import AccountPreviewCard from '@/components/account-preview-card';
import BasketPreviewCard from '@/components/basket-preview-card';
import FavoritePreviewCard from '@/components/favorite-preview-card';
import { useCart } from '@/components/cart-provider';

function AccountIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className="h-5 w-5 fill-none stroke-current stroke-2">
      <circle cx="12" cy="8" r="3.5" />
      <path d="M5 19c0-3.1 2.8-5 7-5s7 1.9 7 5" />
    </svg>
  );
}

function FavoriteIcon({ filled = false }: { filled?: boolean }) {
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

function BasketIcon({ filled = false }: { filled?: boolean }) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      className={`h-5 w-5 stroke-current stroke-2 ${filled ? 'fill-current' : 'fill-none'}`}
    >
      <path d="M5 10h14l-1.5 9H6.5L5 10Z" />
      <path d="M9 10V8a3 3 0 1 1 6 0v2" />
    </svg>
  );
}

export default function NavBar() {
  const pathname = usePathname();
  const {
    count,
    items,
    basketPulseToken,
    favoriteItems,
    favoriteCount,
    favoritePulseToken,
  } = useCart();
  const [isBasketPulsing, setIsBasketPulsing] = useState(false);
  const [isFavoritePulsing, setIsFavoritePulsing] = useState(false);
  const [isAccountPreviewOpen, setIsAccountPreviewOpen] = useState(false);
  const [isBasketPreviewOpen, setIsBasketPreviewOpen] = useState(false);
  const [isFavoritePreviewOpen, setIsFavoritePreviewOpen] = useState(false);

  useEffect(() => {
    if (basketPulseToken === 0) return;
    setIsBasketPulsing(true);
    const timeout = window.setTimeout(() => setIsBasketPulsing(false), 420);
    return () => window.clearTimeout(timeout);
  }, [basketPulseToken]);

  useEffect(() => {
    if (favoritePulseToken === 0) return;
    setIsFavoritePulsing(true);
    const timeout = window.setTimeout(() => setIsFavoritePulsing(false), 420);
    return () => window.clearTimeout(timeout);
  }, [favoritePulseToken]);

  if (pathname.startsWith('/autentificare')) {
    return null;
  }

  return (
    <header className="border-b border-slate-200 bg-white">
      <div className="mx-auto flex w-full max-w-[1400px] items-center justify-end gap-2 px-6 py-4 sm:px-10 lg:px-16">
        <div
          className="relative"
          onMouseEnter={() => setIsAccountPreviewOpen(true)}
          onMouseLeave={() => setIsAccountPreviewOpen(false)}
        >
          <Link
            href="/autentificare"
            aria-label="Account"
            className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 text-slate-700 transition hover:border-slate-300 hover:bg-slate-100 hover:text-slate-900"
          >
            <AccountIcon />
          </Link>

          {isAccountPreviewOpen ? (
            <div className="absolute right-0 top-full z-30 pt-3">
              <AccountPreviewCard />
            </div>
          ) : null}
        </div>

        <div
          className="relative"
          onMouseEnter={() => setIsFavoritePreviewOpen(true)}
          onMouseLeave={() => setIsFavoritePreviewOpen(false)}
        >
          <Link
            href="#"
            aria-label="Favorite"
            id="favorite-icon-button"
            className={`relative inline-flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 transition hover:border-slate-300 hover:bg-slate-100 ${
              isFavoritePulsing ? 'animate-[favorite-bump_400ms_ease-out]' : ''
            }`}
          >
            <span className={favoriteCount > 0 ? 'text-rose-600' : 'text-slate-700'}>
              <FavoriteIcon filled={favoriteCount > 0} />
            </span>
            {favoriteCount > 0 ? (
              <span className="absolute -right-1 -top-1 inline-flex min-h-5 min-w-5 items-center justify-center rounded-full bg-rose-600 px-1 text-[11px] font-semibold leading-none text-white">
                {favoriteCount}
              </span>
            ) : null}
          </Link>

          {isFavoritePreviewOpen ? (
            <div className="absolute right-0 top-full z-30 pt-3">
              <FavoritePreviewCard items={favoriteItems} totalCount={favoriteCount} />
            </div>
          ) : null}
        </div>

        <div
          className="relative"
          onMouseEnter={() => setIsBasketPreviewOpen(true)}
          onMouseLeave={() => setIsBasketPreviewOpen(false)}
        >
          <Link
            href="#"
            aria-label="Basket"
            id="basket-icon-button"
            className={`relative inline-flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 text-slate-700 transition hover:border-slate-300 hover:bg-slate-100 hover:text-slate-900 ${
              isBasketPulsing ? 'animate-[basket-bump_400ms_ease-out]' : ''
            }`}
          >
            <span className={count > 0 ? 'text-indigo-600' : 'text-slate-700'}>
              <BasketIcon filled={count > 0} />
            </span>
            {count > 0 ? (
              <span className="absolute -right-1 -top-1 inline-flex min-h-5 min-w-5 items-center justify-center rounded-full bg-indigo-600 px-1 text-[11px] font-semibold leading-none text-white">
                {count}
              </span>
            ) : null}
          </Link>

          {isBasketPreviewOpen ? (
            <div className="absolute right-0 top-full z-30 pt-3">
              <BasketPreviewCard items={items} totalCount={count} />
            </div>
          ) : null}
        </div>
      </div>
    </header>
  );
}
