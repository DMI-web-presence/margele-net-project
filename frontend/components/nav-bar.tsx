'use client';

import Image from 'next/image';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { ReactNode, useEffect, useState } from 'react';
import AccountPreviewCard from '@/components/account-preview-card';
import BasketPreviewCard from '@/components/basket-preview-card';
import FavoritePreviewCard from '@/components/favorite-preview-card';
import { useCart } from '@/components/cart-provider';
import { formatCategoryLabel } from '@/lib/format-category-label';

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

type NavbarCategory = {
  id: number;
  parentId?: number | null;
  parent_id?: number | null;
  name: string;
  slug: string;
  sortOrder?: number;
  sort_order?: number;
  productCount?: number;
  product_count?: number;
};

type NavbarCategoryGroup = {
  id: number | string;
  label: string;
  slug: string;
  href: string;
};

function buildNavbarCategoryGroups(categories: NavbarCategory[]): NavbarCategoryGroup[] {
  if (categories.length === 0) {
    return categoryLinks.slice(1).map((link) => ({
      id: link.href,
      label: formatCategoryLabel(link.label),
      slug: link.href.split('category=')[1] || '',
      href: link.href,
    }));
  }

  const normalizedCategories = categories.map((category) => ({
    ...category,
    parentId: category.parentId ?? category.parent_id ?? null,
    sortOrder: category.sortOrder ?? category.sort_order ?? 0,
    productCount: category.productCount ?? category.product_count ?? 0,
  }));

  const childrenByParentId = new Map<number, NavbarCategory[]>();
  for (const category of normalizedCategories) {
    if (!category.parentId) continue;
    const children = childrenByParentId.get(category.parentId) || [];
    children.push(category);
    childrenByParentId.set(category.parentId, children);
  }

  const curatedRootOrder = new Map(
    categoryLinks.slice(1).map((link, index) => [
      link.href.split('category=')[1] || '',
      index,
    ]),
  );

  return normalizedCategories
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
    })
    .map((root) => ({
      id: root.id,
      label: formatCategoryLabel(root.name),
      slug: root.slug,
      href: `/catalog?category=${encodeURIComponent(root.slug)}`,
    }));
}

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

type CategoryMenuIconName =
  | 'all'
  | 'beads'
  | 'ring'
  | 'pendant'
  | 'spool'
  | 'layers'
  | 'sparkle'
  | 'tools'
  | 'box'
  | 'sale'
  | 'gear'
  | 'calendar'
  | 'palette'
  | 'cube'
  | 'needle'
  | 'clay'
  | 'gem'
  | 'gift'
  | 'book'
  | 'bread'
  | 'apple'
  | 'folder';

function getCategoryMenuIconName(slug: string): CategoryMenuIconName {
  const iconsBySlug: Record<string, CategoryMenuIconName> = {
    margele: 'beads',
    toho: 'beads',
    'accesorii-bijuterii': 'ring',
    'pandantive-si-charm-uri': 'pendant',
    'fire-snururi-si-elastice': 'spool',
    'materiale-handmade': 'layers',
    'decoratiuni-si-evenimente': 'sparkle',
    unelte: 'tools',
    'seturi-si-mixuri': 'box',
    'reduceri-lichidare-stoc': 'sale',
    'accesorii-decoratrive': 'sparkle',
    'accesorii-tehnice': 'gear',
    'ambalaje-suporturi-unelte': 'box',
    'articole-evenimente': 'calendar',
    'articole-pentru-evenimente': 'calendar',
    'creativ-art-hobby': 'palette',
    'elemente-din-polistiren': 'cube',
    'mercerie-degetar-ro': 'needle',
    'pasta-modelatoare-si-accesorii': 'clay',
    'pietre-semipretioase': 'gem',
    'voucher-cadou': 'gift',
    carti: 'book',
    paine: 'bread',
    'paine-categorie': 'bread',
    'paine-arsa': 'bread',
    mere: 'apple',
  };

  return iconsBySlug[slug] ?? 'folder';
}

function CategoryMenuIcon({
  slug,
  all = false,
  className = 'h-[18px] w-[18px]',
}: {
  slug?: string;
  all?: boolean;
  className?: string;
}) {
  const iconName: CategoryMenuIconName = all ? 'all' : getCategoryMenuIconName(slug || '');
  const paths: Record<CategoryMenuIconName, ReactNode> = {
    all: <><rect x="3" y="3" width="7" height="7" rx="2" /><rect x="14" y="3" width="7" height="7" rx="2" /><rect x="3" y="14" width="7" height="7" rx="2" /><rect x="14" y="14" width="7" height="7" rx="2" /></>,
    beads: <><circle cx="6" cy="8" r="3" /><circle cx="12" cy="15" r="3" /><circle cx="18" cy="8" r="3" /><path d="M3.5 10.5c2.5 6 6 9 8.5 9s6-3 8.5-9" /></>,
    ring: <><circle cx="12" cy="14" r="6" /><path d="m8.5 6 3.5-3 3.5 3-3.5 3-3.5-3Z" /></>,
    pendant: <><path d="M8 3h8M10 3v4M14 3v4" /><path d="m12 21-6-7 6-7 6 7-6 7Z" /></>,
    spool: <><path d="M7 4h10l-2 3v10l2 3H7l2-3V7L7 4Z" /><path d="M9 8h6M9 11h6M9 14h6M9 17h6" /></>,
    layers: <><path d="m12 3 9 5-9 5-9-5 9-5Z" /><path d="m3 12 9 5 9-5M3 16l9 5 9-5" /></>,
    sparkle: <><path d="m12 3 1.6 4.4L18 9l-4.4 1.6L12 15l-1.6-4.4L6 9l4.4-1.6L12 3Z" /><path d="m18.5 14 .8 2.2 2.2.8-2.2.8-.8 2.2-.8-2.2-2.2-.8 2.2-.8.8-2.2Z" /></>,
    tools: <><path d="m14 6 4-4 4 4-4 4" /><path d="m16 8-9.5 9.5a2.1 2.1 0 1 1-3-3L13 5" /><path d="m12 15 5 5 3-3-5-5" /></>,
    box: <><path d="m12 3 9 4.5v9L12 21l-9-4.5v-9L12 3Z" /><path d="m3.5 7.8 8.5 4.3 8.5-4.3M12 12v9" /></>,
    sale: <><path d="M20 13 13 20a2 2 0 0 1-2.8 0L4 13.8V4h9.8L20 10.2a2 2 0 0 1 0 2.8Z" /><circle cx="9" cy="9" r="1" /><path d="m11 16 4-4M11.5 12.5h.01M14.5 15.5h.01" /></>,
    gear: <><circle cx="12" cy="12" r="3" /><path d="M12 2v3M12 19v3M2 12h3M19 12h3M5 5l2 2M17 17l2 2M19 5l-2 2M7 17l-2 2" /></>,
    calendar: <><rect x="3" y="5" width="18" height="16" rx="3" /><path d="M8 3v4M16 3v4M3 10h18" /><path d="m9 15 2 2 4-4" /></>,
    palette: <><path d="M12 3a9 9 0 1 0 0 18h1.5a2 2 0 0 0 0-4H12a1.5 1.5 0 0 1 0-3h3a6 6 0 0 0 6-6c0-3-4-5-9-5Z" /><circle cx="7.5" cy="9" r=".8" /><circle cx="10" cy="6.5" r=".8" /><circle cx="14" cy="6.5" r=".8" /></>,
    cube: <><path d="m12 3 8 4.5v9L12 21l-8-4.5v-9L12 3Z" /><path d="m4.5 7.8 7.5 4.3 7.5-4.3M12 12v9" /></>,
    needle: <><path d="M20 4 5 19M16 4l4 4" /><path d="M5 19c-2 2-4-1-2-3 2.5-2.5 5 3 2 5" /></>,
    clay: <><path d="M5 18c0-4 3-7 7-7s7 3 7 7" /><path d="M8 11c0-4 2-7 4-7s4 3 4 7M4 20h16" /></>,
    gem: <><path d="m3 9 4-5h10l4 5-9 12L3 9Z" /><path d="m7 4 5 17 5-17M3 9h18" /></>,
    gift: <><rect x="3" y="9" width="18" height="12" rx="2" /><path d="M12 9v12M2 9h20M7 9c-3 0-4-5-1-5 2.5 0 6 5 6 5M17 9c3 0 4-5 1-5-2.5 0-6 5-6 5" /></>,
    book: <><path d="M4 4h6a2 2 0 0 1 2 2v15a3 3 0 0 0-3-3H4V4ZM20 4h-6a2 2 0 0 0-2 2v15a3 3 0 0 1 3-3h5V4Z" /></>,
    bread: <><path d="M5 20c-2 0-3-2-2-4l4-9c1-2 3-3 5-3s4 1 5 3l4 9c1 2 0 4-2 4H5Z" /><path d="m9 8 2 3M13 7l2 3" /></>,
    apple: <><path d="M12 7c-5-3-9 1-8 6 1 6 4 8 8 6 4 2 7 0 8-6 1-5-3-9-8-6Z" /><path d="M12 7c0-3 2-5 5-5M12 5C10 3 8 3 7 4" /></>,
    folder: <><path d="M3 6h7l2 2h9v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6Z" /><path d="M3 11h18" /></>,
  };

  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      {paths[iconName]}
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
  const [navbarCategories, setNavbarCategories] = useState<NavbarCategory[]>([]);

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

  useEffect(() => {
    const controller = new AbortController();

    const loadCategories = async () => {
      try {
        const response = await fetch(`${backendUrl}/categories`, {
          cache: 'no-store',
          signal: controller.signal,
        });
        if (!response.ok) return;

        const data = (await response.json()) as NavbarCategory[];
        setNavbarCategories(Array.isArray(data) ? data : []);
      } catch (error) {
        if ((error as Error).name !== 'AbortError') {
          setNavbarCategories([]);
        }
      }
    };

    void loadCategories();
    return () => controller.abort();
  }, [pathname]);

  if (pathname?.startsWith('/autentificare')) {
    return null;
  }

  const categoryMenuGroups = buildNavbarCategoryGroups(navbarCategories);

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
              <div className="absolute left-1/2 top-full z-30 w-72 -translate-x-1/2 pt-3">
                <div className="max-h-[72vh] overflow-y-auto rounded-3xl border border-slate-200 bg-white p-3 shadow-xl">
                  <Link
                    href="/catalog"
                    className="group flex items-center gap-3 rounded-2xl px-3 py-2.5 text-sm font-bold text-violet-700 transition hover:bg-violet-50"
                    onClick={() => setIsCategoryMenuOpen(false)}
                  >
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[10px] bg-violet-100 text-violet-700 transition group-hover:bg-violet-600 group-hover:text-white">
                      <CategoryMenuIcon all />
                    </span>
                    <span>Toate categoriile</span>
                  </Link>
                  {categoryMenuGroups.map((category) => (
                    <div key={category.id} className="border-t border-slate-100 py-1.5 first:border-t-0">
                      <Link
                        href={category.href}
                        className="group flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-semibold leading-5 text-slate-800 transition hover:bg-violet-50 hover:text-violet-800"
                        onClick={() => setIsCategoryMenuOpen(false)}
                      >
                        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[10px] bg-slate-100 text-slate-500 transition group-hover:bg-violet-600 group-hover:text-white">
                          <CategoryMenuIcon slug={category.slug} />
                        </span>
                        <span className="min-w-0">{category.label}</span>
                      </Link>
                    </div>
                  ))}
                </div>
              </div>
            ) : null}
          </div>

          <Link
            href="/noutati"
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
