'use client';

import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';

type HistoryItem = {
  href: string;
  label: string;
  imageUrl?: string | null;
  type?: 'product' | 'page';
};

const storageKey = 'margele_navigation_history_v1';
const historyEventName = 'margele-product-history-recorded';

export default function NavigationHistory() {
  const pathname = usePathname();
  const [items, setItems] = useState<HistoryItem[]>([]);
  const [hasMounted, setHasMounted] = useState(false);

  const readStoredItems = () => {
    try {
      const storedItems = window.localStorage.getItem(storageKey);
      if (!storedItems) return [];
      const parsedItems = JSON.parse(storedItems) as HistoryItem[];
      return Array.isArray(parsedItems)
        ? parsedItems.filter((item) => item.type === 'product' || Boolean(item.imageUrl))
        : [];
    } catch {
      return [];
    }
  };

  useEffect(() => {
    setItems(readStoredItems());
    setHasMounted(true);
  }, []);

  useEffect(() => {
    const handleProductHistoryRecorded = () => {
      setItems(readStoredItems());
    };

    window.addEventListener(historyEventName, handleProductHistoryRecorded);
    return () => window.removeEventListener(historyEventName, handleProductHistoryRecorded);
  }, []);

  const clearHistory = () => {
    window.localStorage.removeItem(storageKey);
    setItems([]);
  };

  if (!hasMounted || pathname === '/' || items.length === 0) {
    return null;
  }

  return (
    <section className="border-t border-slate-200 bg-slate-50">
      <div className="mx-auto flex w-full max-w-[1400px] flex-col gap-3 px-6 py-4 sm:px-10 lg:px-16">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">
            Istoric navigare
          </h2>
          <button
            type="button"
            onClick={clearHistory}
            className="cursor-pointer rounded-full border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:border-slate-400 hover:bg-slate-100 hover:text-slate-900"
          >
            Sterge istoricul
          </button>
        </div>

        <div className="flex gap-3 overflow-x-auto pb-1">
          {items.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="group flex min-w-[9rem] max-w-[11rem] flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white text-sm font-medium text-slate-700 transition hover:border-slate-300 hover:text-slate-950 hover:shadow-sm"
            >
              {item.imageUrl ? (
                <div className="relative aspect-square bg-slate-100">
                  <Image
                    src={item.imageUrl}
                    alt={item.label}
                    fill
                    className="object-contain p-3 transition group-hover:scale-105"
                    unoptimized
                  />
                </div>
              ) : null}
              <span className="line-clamp-2 px-3 py-2">{item.label}</span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
