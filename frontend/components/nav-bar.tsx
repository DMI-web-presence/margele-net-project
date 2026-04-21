'use client';

import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import AccountPreviewCard from '@/components/account-preview-card';
import BasketPreviewCard from '@/components/basket-preview-card';
import FavoritePreviewCard from '@/components/favorite-preview-card';
import { useCart } from '@/components/cart-provider';

const backendUrl =
  process.env.NEXT_PUBLIC_BACKEND_URL ?? 'http://127.0.0.1:3001';

const categoryLinks = [
  { label: 'Toate', href: '/' },
  { label: 'Evenimente', href: '/?category=event' },
  { label: 'Craciun', href: '/?category=1' },
  { label: 'Pandantive', href: '/?category=2' },
];

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

function ChevronDownIcon({ open = false }: { open?: boolean }) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      className={`h-4 w-4 transition-transform ${open ? 'rotate-180' : ''}`}
    >
      <path
        d="M6 9l6 6 6-6"
        className="fill-none stroke-current stroke-2"
      />
    </svg>
  );
}

function getFirstName(fullName: string | null | undefined, email: string | null | undefined) {
  if (fullName && fullName.trim()) {
    const parts = fullName.trim().split(/\s+/);
    return parts[0];
  }
  if (email && email.includes('@')) {
    return email.split('@')[0];
  }
  return 'utilizator';
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
  const [isCategoryMenuOpen, setIsCategoryMenuOpen] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authUser, setAuthUser] = useState<{ name?: string; email?: string } | null>(null);

  useEffect(() => {
    if (basketPulseToken === 0) return;
    const startTimeout = window.setTimeout(() => setIsBasketPulsing(true), 0);
    const endTimeout = window.setTimeout(() => setIsBasketPulsing(false), 420);
    return () => {
      window.clearTimeout(startTimeout);
      window.clearTimeout(endTimeout);
    };
  }, [basketPulseToken]);

  useEffect(() => {
    if (favoritePulseToken === 0) return;
    const startTimeout = window.setTimeout(() => setIsFavoritePulsing(true), 0);
    const endTimeout = window.setTimeout(() => setIsFavoritePulsing(false), 420);
    return () => {
      window.clearTimeout(startTimeout);
      window.clearTimeout(endTimeout);
    };
  }, [favoritePulseToken]);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await fetch(`${backendUrl}/auth/me`, {
          method: 'GET',
          credentials: 'include',
        });
        if (!response.ok) {
          setIsAuthenticated(false);
          setAuthUser(null);
          return;
        }
        const data = (await response.json()) as {
          authenticated?: boolean;
          user?: { name?: string; email?: string };
        };
        setIsAuthenticated(Boolean(data.authenticated));
        setAuthUser(data.user ?? null);
      } catch {
        setIsAuthenticated(false);
        setAuthUser(null);
      }
    };
    void checkAuth();
  }, [pathname]);

  if (pathname?.startsWith('/autentificare')) {
    return null;
  }

  return (
    <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/95 backdrop-blur">
      <div className="mx-auto grid w-full max-w-[1400px] grid-cols-[auto_1fr_auto] items-center gap-4 px-6 py-4 sm:px-10 lg:px-16">
        <Link href="/" className="inline-flex items-center" aria-label="Margele.net">
          <Image
            src="/margelenet-logo-nav-bar.webp"
            alt="Margele.net"
            width={120}
            height={80}
            className="h-auto w-[300px]"
            unoptimized
          />
        </Link>

        <nav className="hidden items-center justify-center gap-2 md:flex" aria-label="Categorii produse">
          <div
            className="relative"
            onMouseEnter={() => setIsCategoryMenuOpen(true)}
            onMouseLeave={() => setIsCategoryMenuOpen(false)}
          >
            <button
              type="button"
              className="inline-flex h-10 cursor-pointer items-center gap-2 rounded-full border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-100 hover:text-slate-900"
              aria-expanded={isCategoryMenuOpen}
              onClick={() => setIsCategoryMenuOpen((current) => !current)}
            >
              Categorii
              <ChevronDownIcon open={isCategoryMenuOpen} />
            </button>

            {isCategoryMenuOpen ? (
              <div className="absolute left-1/2 top-full z-30 w-64 -translate-x-1/2 pt-3">
                <div className="rounded-3xl border border-slate-200 bg-white p-3 shadow-xl">
                  {categoryLinks.map((category) => (
                    <Link
                      key={category.href}
                      href={category.href}
                      className="block rounded-2xl px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 hover:text-slate-900"
                      onClick={() => setIsCategoryMenuOpen(false)}
                    >
                      {category.label}
                    </Link>
                  ))}
                </div>
              </div>
            ) : null}
          </div>

          {categoryLinks.slice(1).map((category) => (
            <Link
              key={category.href}
              href={category.href}
              className="rounded-full px-3 py-2 text-sm font-semibold text-slate-600 transition hover:bg-slate-100 hover:text-slate-900"
            >
              {category.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center justify-end gap-2">
        <div
          className="relative"
          onMouseEnter={() => setIsAccountPreviewOpen(true)}
          onMouseLeave={() => setIsAccountPreviewOpen(false)}
        >
          {isAuthenticated ? (
            <Link
              href="/cont"
              aria-label="Cont utilizator"
              className="inline-flex h-10 items-center gap-2 rounded-full border border-slate-200 px-4 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-100 hover:text-slate-900"
            >
              <span>Bine ai revenit, {getFirstName(authUser?.name, authUser?.email)} 👋</span>
              <ChevronDownIcon open={isAccountPreviewOpen} />
            </Link>
          ) : (
            <Link
              href="/autentificare"
              aria-label="Account"
              className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 text-slate-700 transition hover:border-slate-300 hover:bg-slate-100 hover:text-slate-900"
            >
              <AccountIcon />
            </Link>
          )}

          {isAccountPreviewOpen ? (
            <div className="absolute right-0 top-full z-30 pt-3">
              <AccountPreviewCard
                isAuthenticated={isAuthenticated}
                onLoggedOut={() => setIsAuthenticated(false)}
              />
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
      </div>
    </header>
  );
}
