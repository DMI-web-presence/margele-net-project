'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useCart } from '@/components/cart-provider';
import type { CartItem } from '@/components/cart-provider';

const numberFormatter = new Intl.NumberFormat('ro-RO', {
  style: 'currency',
  currency: 'RON',
  currencyDisplay: 'narrowSymbol',
});

type FavoritePreviewCardProps = {
  items: CartItem[];
  totalCount: number;
};

export default function FavoritePreviewCard({ items, totalCount }: FavoritePreviewCardProps) {
  const { removeFromFavorites } = useCart();

  return (
    <div className="w-[320px] rounded-2xl border border-rose-200 bg-white p-4 shadow-xl">
      <div className="flex items-center justify-between border-b border-rose-100 pb-3">
        <p className="text-sm font-semibold text-slate-900">Favoritele tale</p>
        <p className="text-xs font-medium uppercase tracking-[0.25em] text-rose-500">{totalCount} produse</p>
      </div>

      {items.length === 0 ? (
        <p className="py-6 text-center text-sm text-slate-500">Nu ai produse favorite momentan.</p>
      ) : (
        <div className="mt-3 space-y-4">
          <ul className="max-h-72 space-y-3 overflow-auto pr-1">
            {items.map((item) => (
              <li key={item.product.id}>
                <div className="rounded-xl bg-rose-50 p-2">
                  <Link
                    href={`/products/${item.product.id}`}
                    className="flex items-center gap-3 transition hover:opacity-90"
                  >
                    <div className="relative h-12 w-12 overflow-hidden rounded-lg bg-slate-200">
                      {item.product.imageUrl ? (
                        <Image
                          src={item.product.imageUrl}
                          alt={item.product.name}
                          fill
                          className="object-cover"
                          unoptimized
                        />
                      ) : (
                        <div className="flex h-full items-center justify-center text-[10px] text-slate-500">No img</div>
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-slate-900">{item.product.name}</p>
                      <p className="text-xs text-slate-500">{numberFormatter.format(Number(item.product.price))}</p>
                    </div>
                  </Link>
                  <button
                    type="button"
                    onClick={() => removeFromFavorites(item.product.id)}
                    className="mt-2 cursor-pointer text-xs font-semibold text-rose-600 transition hover:text-rose-700"
                  >
                    Elimina
                  </button>
                </div>
              </li>
            ))}
          </ul>
          <Link
            href="/favorites"
            className="inline-flex w-full items-center justify-center rounded-xl bg-rose-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-rose-700"
          >
            Vezi favorite
          </Link>
        </div>
      )}
    </div>
  );
}
