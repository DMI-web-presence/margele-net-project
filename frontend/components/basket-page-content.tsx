'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useMemo, useState } from 'react';
import { useCart } from '@/components/cart-provider';

type Product = {
  id: number;
  name: string;
  description: string | null;
  price: string;
  imageUrl: string | null;
  categoryId: number | null;
  createdAt: string;
};

type BasketPageContentProps = {
  products: Product[];
};

const currencyFormatter = new Intl.NumberFormat('ro-RO', {
  style: 'currency',
  currency: 'RON',
  currencyDisplay: 'narrowSymbol',
});

function BasketIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      className="h-6 w-6 fill-none stroke-current stroke-[1.8]"
    >
      <path d="M6 9h12l-1 10H7L6 9Z" />
      <path d="M9 9V7a3 3 0 0 1 6 0v2" />
    </svg>
  );
}

function VoucherIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      className="h-5 w-5 fill-none stroke-current stroke-[1.8]"
    >
      <path d="M4 7.5A2.5 2.5 0 0 1 6.5 5h11A2.5 2.5 0 0 1 20 7.5v9A2.5 2.5 0 0 1 17.5 19h-11A2.5 2.5 0 0 1 4 16.5v-9Z" />
      <path d="M10 5v14" />
      <circle cx="8" cy="9" r="1" />
      <circle cx="12" cy="15" r="1" />
    </svg>
  );
}

function ChevronIcon({ open }: { open: boolean }) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      className={`h-5 w-5 fill-none stroke-current stroke-2 transition ${open ? 'rotate-180' : ''}`}
    >
      <path d="m6 9 6 6 6-6" />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className="h-6 w-6 fill-none stroke-current stroke-2">
      <path d="M6 6l12 12M18 6 6 18" />
    </svg>
  );
}

function MinusIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className="h-4 w-4 fill-none stroke-current stroke-2">
      <path d="M5 12h14" />
    </svg>
  );
}

function PlusIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className="h-4 w-4 fill-none stroke-current stroke-2">
      <path d="M12 5v14M5 12h14" />
    </svg>
  );
}

export default function BasketPageContent({ products }: BasketPageContentProps) {
  const {
    items,
    count,
    removeFromCart,
    setCartQuantity,
  } = useCart();
  const [voucherOpen, setVoucherOpen] = useState(false);
  const productMap = useMemo(
    () => new Map(products.map((product) => [product.id, product])),
    [products],
  );
  const enrichedItems = useMemo(
    () =>
      items.map((item) => {
        const product = productMap.get(item.product.id);
        return {
          ...item,
          product: {
            ...item.product,
            name: product?.name ?? item.product.name,
            imageUrl: product?.imageUrl ?? item.product.imageUrl,
            price: product?.price ?? item.product.price,
            description: product?.description ?? null,
          },
        };
      }),
    [items, productMap],
  );

  const subtotal = enrichedItems.reduce(
    (sum, item) => sum + Number(item.product.price) * item.quantity,
    0,
  );
  const delivery = 0;
  const total = subtotal + delivery;

  if (enrichedItems.length === 0) {
    return (
      <main className="px-6 py-10 sm:px-10 lg:px-16">
        <div className="mx-auto max-w-[1200px]">
          <section className="rounded-[2rem] border border-slate-200 bg-white px-6 py-10 shadow-sm sm:px-8">
            <h1 className="text-4xl font-semibold tracking-tight text-slate-900 sm:text-5xl">
              Cosul tau
            </h1>
            <p className="mt-3 max-w-2xl text-base text-slate-600 sm:text-lg">
              Nu ai produse adaugate momentan. Descopera colectia noastra si adauga
              articolele preferate in cos.
            </p>
            <div className="mt-8">
              <Link
                href="/catalog"
                className="inline-flex min-h-12 items-center justify-center rounded-2xl border border-slate-900 bg-white px-6 py-3 text-base font-semibold text-slate-900 transition hover:bg-slate-50"
              >
                Continua cumparaturile
              </Link>
            </div>
          </section>
        </div>
      </main>
    );
  }

  return (
    <main className="px-6 py-10 sm:px-10 lg:px-16">
      <div className="mx-auto max-w-[1200px]">
        <div className="grid gap-8 xl:grid-cols-[minmax(0,1fr)_22rem]">
          <section className="space-y-8">
            <div className="space-y-4">
              <h1 className="text-4xl font-semibold tracking-tight text-slate-900 sm:text-5xl">
                Cosul tau ({count} {count === 1 ? 'articol' : 'articole'})
              </h1>
              <div className="flex items-start gap-3 text-slate-900">
                <div className="pt-0.5">
                  <BasketIcon />
                </div>
                <div className="space-y-0.5">
                  <p className="text-base">Expediat din stocul Margele.net</p>
                  <p className="text-xl font-semibold tracking-tight">
                    Livrare estimata in 1-3 zile lucratoare
                  </p>
                </div>
              </div>
            </div>

            <div className="rounded-[2rem] border border-slate-200 bg-white shadow-sm">
              <ul className="divide-y divide-slate-200">
                {enrichedItems.map((item) => {
                  const unitPrice = Number(item.product.price);
                  const linePrice = unitPrice * item.quantity;

                  return (
                    <li key={item.product.id} className="px-6 py-6 sm:px-8">
                      <div className="grid gap-5 lg:grid-cols-[7.5rem_minmax(0,1fr)_auto_auto] lg:items-start">
                        <Link
                          href={`/products/${item.product.id}`}
                          className="group relative overflow-hidden rounded-[1.5rem] border border-slate-200 bg-slate-50"
                        >
                          {item.product.imageUrl ? (
                            <Image
                              src={item.product.imageUrl}
                              alt={item.product.name}
                              width={220}
                              height={220}
                              className="h-[120px] w-full object-contain transition duration-300 group-hover:scale-105"
                              unoptimized
                            />
                          ) : (
                            <div className="flex h-[120px] items-center justify-center text-sm text-slate-500">
                              Fara imagine
                            </div>
                          )}
                        </Link>

                        <div className="space-y-3">
                          <div className="space-y-1">
                            <Link
                              href={`/products/${item.product.id}`}
                              className="text-xl font-semibold leading-7 text-slate-900 transition hover:text-slate-700"
                            >
                              {item.product.name}
                            </Link>
                            {item.product.description ? (
                              <p className="text-sm leading-6 text-slate-600">
                                {item.product.description}
                              </p>
                            ) : null}
                          </div>

                          <div className="space-y-1">
                            <p className="text-2xl font-semibold tracking-tight text-slate-900">
                              {currencyFormatter.format(linePrice)}
                            </p>
                            <p className="text-sm text-slate-500">
                              Pret unitar: {currencyFormatter.format(unitPrice)}
                            </p>
                          </div>

                          <div className="flex flex-wrap gap-6 text-sm text-slate-600">
                            <p>Produs ID: {item.product.id}</p>
                            {item.product.description ? (
                              <p className="max-w-xl">Detalii: {item.product.description}</p>
                            ) : null}
                          </div>

                          <Link
                            href={`/products/${item.product.id}`}
                            className="inline-flex text-sm font-semibold text-slate-900 underline underline-offset-4 transition hover:text-slate-700"
                          >
                            Vezi produsul
                          </Link>
                        </div>

                        <div className="lg:justify-self-end">
                          <label className="sr-only" htmlFor={`quantity-${item.product.id}`}>
                            Cantitate pentru {item.product.name}
                          </label>
                          <div className="flex items-center gap-2">
                            {item.quantity > 1 ? (
                              <button
                                type="button"
                                onClick={() => setCartQuantity(item.product.id, item.quantity - 1)}
                                className="inline-flex h-11 w-11 cursor-pointer items-center justify-center rounded-2xl border border-slate-300 bg-white text-slate-700 transition hover:border-slate-400 hover:bg-slate-50 hover:text-slate-900"
                                aria-label={`Scade cantitatea pentru ${item.product.name}`}
                              >
                                <MinusIcon />
                              </button>
                            ) : (
                              <div className="h-11 w-11" aria-hidden="true" />
                            )}

                            <input
                              id={`quantity-${item.product.id}`}
                              type="number"
                              min={1}
                              max={999}
                              value={item.quantity}
                              onChange={(event) => {
                                const rawValue = event.target.value;
                                if (!rawValue) return;
                                const nextQuantity = Number(rawValue);
                                if (!Number.isFinite(nextQuantity)) return;
                                setCartQuantity(item.product.id, nextQuantity);
                              }}
                              className="w-24 rounded-2xl border border-slate-300 bg-white px-4 py-3 text-center text-base text-slate-900 outline-none transition hover:border-slate-400 focus:border-slate-500 [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                            />

                            {item.quantity < 999 ? (
                              <button
                                type="button"
                                onClick={() => setCartQuantity(item.product.id, item.quantity + 1)}
                                className="inline-flex h-11 w-11 cursor-pointer items-center justify-center rounded-2xl border border-slate-300 bg-white text-slate-700 transition hover:border-slate-400 hover:bg-slate-50 hover:text-slate-900"
                                aria-label={`Creste cantitatea pentru ${item.product.name}`}
                              >
                                <PlusIcon />
                              </button>
                            ) : (
                              <div className="h-11 w-11" aria-hidden="true" />
                            )}
                          </div>
                        </div>

                        <div className="flex justify-end lg:pl-2">
                          <button
                            type="button"
                            onClick={() => removeFromCart(item.product.id)}
                            className="inline-flex h-12 w-12 cursor-pointer items-center justify-center rounded-full border border-transparent text-slate-500 transition hover:border-slate-200 hover:bg-slate-50 hover:text-slate-900"
                            aria-label={`Elimina ${item.product.name} din cos`}
                          >
                            <CloseIcon />
                          </button>
                        </div>
                      </div>
                    </li>
                  );
                })}
              </ul>
            </div>

            <div className="space-y-2 text-sm text-slate-700">
              <p>
                Articolele din cos nu sunt rezervate.
              </p>
              <p>
                Pret: valorile afisate sunt calculate din preturile actuale ale produselor din catalog.
              </p>
            </div>
          </section>

          <aside className="h-fit rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm xl:sticky xl:top-24">
            <button
              type="button"
              onClick={() => setVoucherOpen((current) => !current)}
              className="flex w-full cursor-pointer items-center justify-between gap-3 text-left"
              aria-expanded={voucherOpen}
            >
              <span className="flex items-center gap-3 text-xl font-semibold text-slate-900">
                <VoucherIcon />
                Vouchere
              </span>
              <ChevronIcon open={voucherOpen} />
            </button>

            {voucherOpen ? (
              <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-sm leading-6 text-slate-600">
                  Functionalitatea pentru coduri promotionale va fi adaugata in continuare.
                </p>
              </div>
            ) : null}

            <div className="mt-6 space-y-3 border-t border-slate-200 pt-6 text-lg text-slate-900">
              <div className="flex items-center justify-between gap-4">
                <span className="text-slate-700">Suma partiala</span>
                <span className="font-medium">{currencyFormatter.format(subtotal)}</span>
              </div>
              <div className="flex items-center justify-between gap-4">
                <span className="text-slate-700">Livrare</span>
                <span className="font-medium">{currencyFormatter.format(delivery)}</span>
              </div>
              <div className="flex items-center justify-between gap-4 border-t border-slate-200 pt-4 text-xl font-semibold">
                <span>Total</span>
                <span>{currencyFormatter.format(total)}</span>
              </div>
              <p className="text-sm text-slate-500">TVA inclus</p>
            </div>

            <button
              type="button"
              className="mt-6 inline-flex min-h-12 w-full cursor-pointer items-center justify-center rounded-2xl bg-slate-900 px-6 py-3 text-base font-semibold text-white transition hover:bg-black"
            >
              Mergeti la checkout
            </button>

            <div className="mt-6 space-y-3 border-t border-slate-200 pt-6">
              <p className="text-sm font-semibold text-slate-900">Acceptam</p>
              <div className="flex flex-wrap gap-2">
                {['Visa', 'Mastercard', 'Maestro', 'Apple Pay', 'Plata online'].map((label) => (
                  <span
                    key={label}
                    className="inline-flex min-h-10 items-center justify-center rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm font-semibold text-slate-700"
                  >
                    {label}
                  </span>
                ))}
              </div>
            </div>
          </aside>
        </div>
      </div>
    </main>
  );
}
