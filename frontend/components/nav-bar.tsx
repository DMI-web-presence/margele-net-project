'use client';

import Image from 'next/image';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import AccountPreviewCard from '@/components/account-preview-card';
import BasketPreviewCard from '@/components/basket-preview-card';
import FavoritePreviewCard from '@/components/favorite-preview-card';
import { useCart } from '@/components/cart-provider';

const backendUrl =
  process.env.NEXT_PUBLIC_BACKEND_URL ?? 'http://localhost:3001';

const categoryLinks = [
  { label: 'Toate', href: '/catalog' },
  { label: 'Margele', href: '/catalog?category=margele' },
  { label: 'Accesorii bijuterii', href: '/catalog?category=accesorii-bijuterii' },
  { label: 'Pandantive si charm-uri', href: '/catalog?category=pandantive-si-charm-uri' },
  { label: 'Fire, snururi si elastice', href: '/catalog?category=fire-snururi-si-elastice' },
  { label: 'Materiale', href: '/catalog?category=materiale-handmade' },
  { label: 'Decoratiuni si evenimente', href: '/catalog?category=decoratiuni-si-evenimente' },
  { label: 'Unelte', href: '/catalog?category=unelte' },
  { label: 'Seturi si mixuri', href: '/catalog?category=seturi-si-mixuri' },
  { label: 'Reduceri', href: '/catalog?category=reduceri-lichidare-stoc' },
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
      className={`h-4 w-4 shrink-0 transition-transform ${open ? 'rotate-180' : ''}`}
    >
      <path
        d="M6 9l6 6 6-6"
        className="fill-none stroke-current stroke-2"
      />
    </svg>
  );
}

function SearchIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className="h-4 w-4 fill-none stroke-current stroke-2">
      <circle cx="11" cy="11" r="6" />
      <path d="m20 20-4.2-4.2" />
    </svg>
  );
}

function getAccountInitials(fullName?: string, email?: string) {
  const trimmedName = String(fullName || '').trim();
  if (trimmedName) {
    const parts = trimmedName.split(/\s+/).filter(Boolean);
    const initials = parts.slice(0, 2).map((part) => part.charAt(0).toUpperCase()).join('');
    if (initials) return initials;
  }

  const trimmedEmail = String(email || '').trim();
  if (trimmedEmail) {
    return trimmedEmail.slice(0, 2).toUpperCase();
  }

  return 'CT';
}

export default function NavBar() {
  const pathname = usePathname();
  const router = useRouter();
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
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authUser, setAuthUser] = useState<{ name?: string; email?: string } | null>(null);
  const [isNavCompact, setIsNavCompact] = useState(false);
  const [isHiddenOnMobile, setIsHiddenOnMobile] = useState(false);

  useEffect(() => {
    let lastScrollY = window.scrollY;
    let accumulatedDownScroll = 0;

    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      const delta = currentScrollY - lastScrollY;
      const isDesktop = window.matchMedia('(min-width: 1024px)').matches;

      setIsNavCompact(currentScrollY > 72);

      if (isDesktop) {
        setIsHiddenOnMobile(false);
      } else if (currentScrollY < 32) {
        accumulatedDownScroll = 0;
        setIsHiddenOnMobile(false);
      } else if (delta < -4) {
        accumulatedDownScroll = 0;
        setIsHiddenOnMobile(false);
      } else if (delta > 0 && currentScrollY > 120) {
        accumulatedDownScroll += delta;
        if (accumulatedDownScroll > 96) {
          setIsHiddenOnMobile(true);
        }
      }

      lastScrollY = currentScrollY;
    };

    handleScroll();
    window.addEventListener('scroll', handleScroll, { passive: true });

    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

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

  const handleSearchSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const query = searchQuery.trim();
    router.push(query ? `/catalog?search=${encodeURIComponent(query)}` : '/catalog');
    setSearchQuery('');
    setIsSearchOpen(false);
  };

  return (
    <header
      className={`sticky top-0 z-40 border-b bg-white/95 backdrop-blur transition-[box-shadow,background-color,border-color,transform] duration-500 ease-out lg:translate-y-0 ${
        isNavCompact ? 'border-slate-200 shadow-md' : 'border-slate-200 shadow-none'
      } ${isHiddenOnMobile ? '-translate-y-full' : 'translate-y-0'}`}
    >
      <div
        className={`mx-auto grid w-full max-w-[1400px] grid-cols-[auto_1fr_auto] items-center px-6 transition-[height,gap] duration-500 ease-out sm:px-10 lg:px-16 ${
          isNavCompact ? 'h-14 gap-3' : 'h-20 gap-4'
        }`}
      >
        <Link href="/" className="inline-flex items-center" aria-label="Margele.net">
          <Image
            src="/margelenet-logo-nav-bar-cropped.png"
            alt="Margele.net"
            width={1045}
            height={290}
            className={`h-auto transition-[width] duration-500 ease-out ${
              isNavCompact ? 'w-[140px] sm:w-[158px]' : 'w-[176px] sm:w-[210px]'
            }`}
          />
        </Link>

        <nav
          className={`hidden items-center justify-center transition-[gap] duration-500 ease-out md:flex ${
            isNavCompact ? 'gap-1' : 'gap-2'
          }`}
          aria-label="Navigatie principala"
        >
          <div
            className="relative"
            onMouseEnter={() => setIsCategoryMenuOpen(true)}
            onMouseLeave={() => setIsCategoryMenuOpen(false)}
          >
            <button
              type="button"
              className={`inline-flex cursor-pointer items-center gap-2 rounded-full border border-violet-200 bg-violet-600 font-semibold text-white transition-[height,padding,font-size,background-color,border-color,color,box-shadow] duration-500 ease-out shadow-[0_10px_22px_rgba(124,58,237,0.22)] hover:border-violet-300 hover:bg-violet-700 hover:text-white ${
                isNavCompact ? 'h-9 px-3 text-xs' : 'h-10 px-4 text-[13px]'
              }`}
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

          <Link
            href="/#noutati"
            className={`inline-flex items-center rounded-full border border-violet-200 bg-white font-semibold text-slate-700 transition-[height,padding,font-size,background-color,border-color,color] duration-500 ease-out hover:border-violet-300 hover:bg-slate-100 hover:text-slate-900 ${
              isNavCompact ? 'h-9 px-3 text-xs' : 'h-10 px-4 text-[13px]'
            }`}
          >
            Noutati
          </Link>

          <form
            onSubmit={handleSearchSubmit}
            className={`flex items-center overflow-hidden rounded-full border border-violet-200 bg-white text-slate-600 transition-[width,background-color,border-color,box-shadow] duration-300 ease-out hover:border-violet-300 hover:bg-slate-50 hover:text-slate-900 focus-within:border-violet-400 focus-within:bg-slate-50 focus-within:text-slate-900 ${
              isSearchOpen ? 'w-[18.5rem] shadow-sm' : isNavCompact ? 'w-[5.5rem]' : 'w-[6.25rem]'
            } ${isNavCompact ? 'h-9' : 'h-10'}`}
            onMouseEnter={() => setIsSearchOpen(true)}
            onMouseLeave={() => setIsSearchOpen(false)}
            onFocusCapture={() => setIsSearchOpen(true)}
            onBlur={(event) => {
              if (!event.currentTarget.contains(event.relatedTarget as Node | null)) {
                setIsSearchOpen(false);
              }
            }}
          >
            <button
              type="submit"
              aria-label="Cauta"
              className={`inline-flex shrink-0 items-center gap-2 font-semibold transition-[padding,font-size,color] duration-300 ${
                isNavCompact ? 'px-2.5 text-xs' : 'px-3 text-sm'
              }`}
            >
              <SearchIcon />
              <span
                className={`overflow-hidden whitespace-nowrap transition-[max-width,opacity] duration-300 ${
                  isSearchOpen ? 'max-w-0 opacity-0' : 'max-w-[4rem] opacity-100'
                }`}
              >
                Cauta
              </span>
            </button>
            <input
              type="text"
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder="Cauta in colectia noastra..."
              className={`min-w-0 flex-1 bg-transparent pr-3 text-sm text-slate-900 outline-none placeholder:text-slate-400 transition-[opacity,transform] duration-300 ${
                isSearchOpen ? 'opacity-100' : 'pointer-events-none opacity-0'
              }`}
            />
          </form>
        </nav>

        <div className="flex items-center justify-end gap-2">
          <div
            className="relative"
            onMouseEnter={() => setIsAccountPreviewOpen(true)}
            onMouseLeave={() => setIsAccountPreviewOpen(false)}
          >
            <Link
              href={isAuthenticated ? '/cont' : '/autentificare'}
              aria-label="Cont"
              className={`inline-flex items-center gap-2 rounded-full border border-violet-200 px-4 font-semibold text-slate-700 transition-[height,padding,font-size,background-color,border-color,color] duration-500 ease-out hover:border-violet-300 hover:bg-slate-100 hover:text-slate-900 ${
                isNavCompact ? 'h-9 text-xs' : 'h-10 text-sm'
              }`}
            >
              <AccountIcon />
              <span>{isAuthenticated ? getAccountInitials(authUser?.name, authUser?.email) : 'Cont'}</span>
              {isAuthenticated ? <ChevronDownIcon open={isAccountPreviewOpen} /> : null}
            </Link>

            {isAuthenticated && isAccountPreviewOpen ? (
              <div className="absolute right-0 top-full z-30 pt-3">
                <AccountPreviewCard
                  isAuthenticated={isAuthenticated}
                  onClose={() => setIsAccountPreviewOpen(false)}
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
              href="/favorites"
              aria-label="Favorite"
              id="favorite-icon-button"
              className={`relative inline-flex items-center justify-center rounded-full border border-violet-200 transition-[height,width,background-color,border-color] duration-500 ease-out hover:border-violet-300 hover:bg-slate-100 ${
                isNavCompact ? 'h-9 w-9' : 'h-10 w-10'
              } ${
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
              href="/basket"
              aria-label="Cos"
              id="basket-icon-button"
              className={`relative inline-flex items-center justify-center rounded-full border border-violet-200 text-slate-700 transition-[height,width,background-color,border-color,color] duration-500 ease-out hover:border-violet-300 hover:bg-slate-100 hover:text-slate-900 ${
                isNavCompact ? 'h-9 w-9' : 'h-10 w-10'
              } ${
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
