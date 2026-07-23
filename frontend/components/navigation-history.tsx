'use client';

import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useSyncExternalStore } from 'react';
import { getProductImageVariantConfig } from '@/lib/product-image-variants';

type HistoryItem = {
  href: string;
  label: string;
  imageUrl?: string | null;
  type?: 'product' | 'page';
};

const storageKey = 'margele_navigation_history_v1';
const historyEventName = 'margele-product-history-recorded';
const emptyHistorySnapshot: HistoryItem[] = [];
const hydratedSnapshot = true;
const serverHydrationSnapshot = false;
let cachedHistoryRawValue: string | null = null;
let cachedHistorySnapshot: HistoryItem[] = emptyHistorySnapshot;

export default function NavigationHistory() {
  const pathname = usePathname();
  const isHydrated = useSyncExternalStore(subscribeToHydration, getClientSnapshot, getServerSnapshot);
  const items = useSyncExternalStore(subscribeToHistory, getHistorySnapshot, getEmptyHistorySnapshot);

  if (!isHydrated || pathname === '/' || items.length === 0) {
    return null;
  }

  return (
    <section className="border-t border-slate-200 bg-slate-50">
      <div className="mx-auto flex w-full max-w-[1400px] flex-col gap-3 px-6 py-4 sm:px-10 lg:px-16">
        <h2 className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">
          Istoric navigare
        </h2>

        <div className="flex gap-3 overflow-x-auto pb-1">
          {items.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="group flex h-[13.75rem] w-[9rem] shrink-0 flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white text-sm font-medium text-slate-700 transition hover:border-slate-300 hover:text-slate-950 hover:shadow-sm"
            >
              {item.imageUrl ? (
                <div className="relative h-[8.5rem] shrink-0 bg-slate-100">
                  <Image
                    src={item.imageUrl}
                    alt={item.label}
                    fill
                    sizes={getProductImageVariantConfig('card').sizes}
                    className="object-cover transition group-hover:scale-105"
                    unoptimized
                  />
                </div>
              ) : null}
              <span className="line-clamp-3 min-h-0 px-3 py-2 leading-5">{item.label}</span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}

function subscribeToHydration() {
  return () => {};
}

function getClientSnapshot() {
  return hydratedSnapshot;
}

function getServerSnapshot() {
  return serverHydrationSnapshot;
}

function subscribeToHistory(onStoreChange: () => void) {
  window.addEventListener(historyEventName, onStoreChange);
  window.addEventListener('storage', onStoreChange);

  return () => {
    window.removeEventListener(historyEventName, onStoreChange);
    window.removeEventListener('storage', onStoreChange);
  };
}

function getHistorySnapshot() {
  try {
    const storedItems = window.localStorage.getItem(storageKey);
    if (!storedItems) return emptyHistorySnapshot;
    if (storedItems === cachedHistoryRawValue) {
      return cachedHistorySnapshot;
    }

    const parsedItems = JSON.parse(storedItems) as HistoryItem[];
    cachedHistoryRawValue = storedItems;
    cachedHistorySnapshot = Array.isArray(parsedItems)
      ? parsedItems.filter((item) => item.type === 'product' || Boolean(item.imageUrl))
      : emptyHistorySnapshot;
    return cachedHistorySnapshot;
  } catch {
    cachedHistoryRawValue = null;
    cachedHistorySnapshot = emptyHistorySnapshot;
    return emptyHistorySnapshot;
  }
}

function getEmptyHistorySnapshot() {
  return emptyHistorySnapshot;
}
