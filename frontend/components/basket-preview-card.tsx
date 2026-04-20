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

type BasketPreviewCardProps = {
  items: CartItem[];
  totalCount: number;
};

export default function BasketPreviewCard({ items, totalCount }: BasketPreviewCardProps) {
  const { removeFromCart, incrementCartQuantity, decrementCartQuantity } = useCart();
  const totalCost = items.reduce(
    (sum, item) => sum + Number(item.product.price) * item.quantity,
    0,
  );

  return (
    <div className="w-[320px] rounded-2xl border border-slate-200 bg-white p-4 shadow-xl">
      <div className="flex items-center justify-between border-b border-slate-200 pb-3">
        <p className="text-sm font-semibold text-slate-900">Cosul tau</p>
        <p className="text-xs font-medium uppercase tracking-[0.25em] text-slate-500">{totalCount} produse</p>
      </div>

      {items.length === 0 ? (
        <p className="py-6 text-center text-sm text-slate-500">Nu ai produse adaugate in cos.</p>
      ) : (
        <div className="mt-3 space-y-4">
          <ul className="max-h-72 space-y-3 overflow-auto pr-1">
            {items.map((item) => (
              <li key={item.product.id}>
                <div className="rounded-xl bg-slate-50 p-2">
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
                  <div className="mt-2 flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => decrementCartQuantity(item.product.id)}
                      className="inline-flex h-6 w-6 cursor-pointer items-center justify-center rounded-full border border-slate-300 text-sm font-semibold text-slate-700 transition hover:bg-slate-200"
                      aria-label={`Scade cantitatea pentru ${item.product.name}`}
                    >
                      -
                    </button>
                    <span className="min-w-6 text-center text-xs font-semibold text-indigo-700">
                      {item.quantity}
                    </span>
                    <button
                      type="button"
                      onClick={() => incrementCartQuantity(item.product.id)}
                      className="inline-flex h-6 w-6 cursor-pointer items-center justify-center rounded-full border border-slate-300 text-sm font-semibold text-slate-700 transition hover:bg-slate-200"
                      aria-label={`Creste cantitatea pentru ${item.product.name}`}
                    >
                      +
                    </button>
                  </div>
                  <button
                    type="button"
                    onClick={() => removeFromCart(item.product.id)}
                    className="mt-2 cursor-pointer text-xs font-semibold text-slate-600 transition hover:text-slate-900"
                  >
                    Elimina
                  </button>
                </div>
              </li>
            ))}
          </ul>
          <div className="flex items-center justify-between border-t border-slate-200 pt-3">
            <p className="text-sm font-semibold text-slate-900">Cost total</p>
            <p className="text-sm font-semibold text-slate-900">{numberFormatter.format(totalCost)}</p>
          </div>
          <Link
            href="/basket"
            className="inline-flex w-full items-center justify-center rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-indigo-700"
          >
            Vezi cosul
          </Link>
        </div>
      )}
    </div>
  );
}
