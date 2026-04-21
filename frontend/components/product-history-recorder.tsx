'use client';

import { useEffect } from 'react';

type ProductHistoryRecorderProps = {
  product: {
    id: number;
    name: string;
    imageUrl: string | null;
  };
};

const historyEventName = 'margele-product-history-recorded';
const storageKey = 'margele_navigation_history_v1';
const maxItems = 8;

export default function ProductHistoryRecorder({ product }: ProductHistoryRecorderProps) {
  useEffect(() => {
    const timeout = window.setTimeout(() => {
      const href = `/products/${product.id}`;
      const item = {
        href,
        label: product.name,
        imageUrl: product.imageUrl,
        type: 'product',
      };

      try {
        const storedItems = window.localStorage.getItem(storageKey);
        const parsedItems = storedItems ? (JSON.parse(storedItems) as typeof item[]) : [];
        const currentItems = Array.isArray(parsedItems) ? parsedItems : [];
        const nextItems = [
          item,
          ...currentItems.filter((currentItem) => currentItem.href !== href),
        ].slice(0, maxItems);

        window.localStorage.setItem(storageKey, JSON.stringify(nextItems));
        window.dispatchEvent(new Event(historyEventName));
      } catch {
        window.localStorage.setItem(storageKey, JSON.stringify([item]));
        window.dispatchEvent(new Event(historyEventName));
      }
    }, 0);

    return () => window.clearTimeout(timeout);
  }, [product.id, product.imageUrl, product.name]);

  return null;
}
