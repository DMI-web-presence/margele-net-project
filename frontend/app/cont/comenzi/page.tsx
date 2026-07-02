'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import AccountSidebar from '@/components/account-sidebar';

const backendUrl =
  process.env.NEXT_PUBLIC_BACKEND_URL ?? 'http://localhost:3001';

const orderPeriods = [
  'Din ultimele 6 luni',
  'Din ultimele 12 luni',
  'Din ultimii 2 ani',
  'Toate comenzile',
] as const;

type OrderPeriod = (typeof orderPeriods)[number];

type OrderItem = {
  id: number;
  productId: number | null;
  productName: string;
  productImageUrl: string;
  unitPrice: string;
  quantity: number;
  lineTotal: string;
};

type Order = {
  id: number;
  orderNumber: string;
  status: string;
  subtotal: string;
  deliveryTotal: string;
  total: string;
  currency: string;
  createdAt: string;
  items: OrderItem[];
};

const currencyFormatter = new Intl.NumberFormat('ro-RO', {
  style: 'currency',
  currency: 'RON',
  currencyDisplay: 'narrowSymbol',
});

const periodMonths: Record<OrderPeriod, number | null> = {
  'Din ultimele 6 luni': 6,
  'Din ultimele 12 luni': 12,
  'Din ultimii 2 ani': 24,
  'Toate comenzile': null,
};

function OrdersIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      className="h-10 w-10 fill-none stroke-current stroke-[1.7] text-slate-900"
    >
      <path d="M7 9h10l-1 10H8L7 9Z" />
      <path d="M9.5 9V7.5a2.5 2.5 0 0 1 5 0V9" />
    </svg>
  );
}

function formatMoney(value: string) {
  return currencyFormatter.format(Number(value || 0));
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat('ro-RO', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  }).format(new Date(value));
}

function getOrderSummary(order: Order) {
  const itemCount = order.items.reduce((sum, item) => sum + item.quantity, 0);
  return `${itemCount} ${itemCount === 1 ? 'articol' : 'articole'}`;
}

export default function ContComenziPage() {
  const [selectedPeriod, setSelectedPeriod] = useState<OrderPeriod>('Din ultimele 6 luni');
  const [orders, setOrders] = useState<Order[]>([]);
  const [expandedOrderIds, setExpandedOrderIds] = useState<number[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState('');

  const queryString = useMemo(() => {
    const months = periodMonths[selectedPeriod];
    return months ? `?months=${months}` : '';
  }, [selectedPeriod]);

  useEffect(() => {
    const loadOrders = async () => {
      setIsLoading(true);
      setLoadError('');

      try {
        const response = await fetch(`${backendUrl}/auth/orders${queryString}`, {
          method: 'GET',
          credentials: 'include',
        });

        const result = (await response.json().catch(() => null)) as Order[] | { message?: string } | null;
        if (!response.ok) {
          throw new Error(
            result && !Array.isArray(result) && result.message
              ? result.message
              : 'Nu am putut incarca istoricul comenzilor.',
          );
        }

        setOrders(Array.isArray(result) ? result : []);
      } catch (error) {
        setLoadError(
          error instanceof Error ? error.message : 'Nu am putut incarca istoricul comenzilor.',
        );
      } finally {
        setIsLoading(false);
      }
    };

    void loadOrders();
  }, [queryString]);

  const toggleOrder = (orderId: number) => {
    setExpandedOrderIds((current) =>
      current.includes(orderId)
        ? current.filter((id) => id !== orderId)
        : [...current, orderId],
    );
  };

  return (
    <main className="px-6 py-10 sm:px-10 lg:px-16">
      <div className="mx-auto grid max-w-[1200px] gap-6 lg:grid-cols-[18rem_1fr]">
        <AccountSidebar activePath="/cont/comenzi" />

        <section className="space-y-2">
          <h1 className="text-4xl font-semibold tracking-tight text-slate-900 sm:text-5xl">
            Comenzi
          </h1>

          <div className="mt-8 rounded-[2rem] border border-slate-200 bg-white px-6 py-6 shadow-sm sm:px-8 sm:py-8">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
              <div className="w-full max-w-sm">
                <label htmlFor="orders-period" className="sr-only">
                  Filtru comenzi
                </label>
                <div className="relative">
                  <select
                    id="orders-period"
                    value={selectedPeriod}
                    onChange={(event) => setSelectedPeriod(event.target.value as OrderPeriod)}
                    className="w-full cursor-pointer appearance-none rounded-2xl border border-slate-300 bg-white px-4 py-4 pr-12 text-base text-slate-900 outline-none transition focus:border-slate-900 focus:ring-2 focus:ring-slate-200"
                  >
                    {orderPeriods.map((period) => (
                      <option key={period} value={period}>
                        {period}
                      </option>
                    ))}
                  </select>
                  <span className="pointer-events-none absolute inset-y-0 right-4 flex items-center text-slate-900">
                    <svg aria-hidden="true" viewBox="0 0 20 20" className="h-5 w-5 fill-none stroke-current stroke-2">
                      <path d="m4 7 6 6 6-6" />
                    </svg>
                  </span>
                </div>
              </div>

              <div className="flex flex-col items-start gap-3 lg:items-end">
                <Link
                  href="#"
                  className="inline-flex min-h-12 min-w-[220px] cursor-pointer items-center justify-center rounded-2xl border border-slate-900 bg-white px-6 py-3 text-base font-semibold text-slate-900 transition hover:bg-slate-50"
                >
                  Returneaza un articol
                </Link>
                <Link
                  href="#"
                  className="text-sm font-semibold text-slate-900 underline decoration-slate-900 underline-offset-4"
                >
                  Politici si conditii de retur
                </Link>
              </div>
            </div>

            {isLoading ? (
              <div className="py-16 text-base text-slate-600">Se incarca comenzile...</div>
            ) : loadError ? (
              <div className="py-16 text-base font-semibold text-red-600">{loadError}</div>
            ) : orders.length > 0 ? (
              <div className="mt-8 space-y-4">
                {orders.map((order) => {
                  const isExpanded = expandedOrderIds.includes(order.id);

                  return (
                    <article
                      key={order.id}
                      className="rounded-[1.75rem] border border-slate-200 bg-slate-50 p-5 sm:p-6"
                    >
                      <button
                        type="button"
                        onClick={() => toggleOrder(order.id)}
                        aria-expanded={isExpanded}
                        className="flex w-full cursor-pointer flex-col gap-4 text-left lg:flex-row lg:items-start lg:justify-between"
                      >
                        <div className="flex gap-4">
                          <span className="mt-6 inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-900">
                            <svg
                              aria-hidden="true"
                              viewBox="0 0 20 20"
                              className={`h-5 w-5 fill-none stroke-current stroke-2 transition ${
                                isExpanded ? 'rotate-180' : ''
                              }`}
                            >
                              <path d="m4 7 6 6 6-6" />
                            </svg>
                          </span>
                          <div>
                            <p className="text-sm font-semibold uppercase tracking-[0.08em] text-slate-500">
                              {order.orderNumber}
                            </p>
                            <h2 className="mt-1 text-2xl font-semibold tracking-tight text-slate-900">
                              Comanda din {formatDate(order.createdAt)}
                            </h2>
                            <p className="mt-1 text-sm text-slate-600">
                              {getOrderSummary(order)} - {order.status}
                            </p>
                          </div>
                        </div>
                        <div className="text-left lg:text-right">
                          <p className="text-sm text-slate-600">Total</p>
                          <p className="text-2xl font-semibold text-slate-900">
                            {formatMoney(order.total)}
                          </p>
                          <p className="mt-1 text-sm font-semibold text-slate-600">
                            {isExpanded ? 'Ascunde produse' : 'Vezi produse'}
                          </p>
                        </div>
                      </button>

                      {isExpanded ? (
                        <ul className="mt-5 divide-y divide-slate-200 border-t border-slate-200">
                          {order.items.map((item) => (
                            <li key={item.id} className="grid gap-4 py-5 sm:grid-cols-[5rem_1fr_auto] sm:items-center">
                              <div className="relative h-20 w-20 overflow-hidden rounded-2xl border border-slate-200 bg-white">
                                {item.productImageUrl ? (
                                  <Image
                                    src={item.productImageUrl}
                                    alt={item.productName}
                                    fill
                                    sizes="80px"
                                    className="object-contain p-2"
                                    unoptimized
                                  />
                                ) : (
                                  <div className="flex h-full items-center justify-center text-xs text-slate-400">
                                    Fara imagine
                                  </div>
                                )}
                              </div>

                              <div>
                                <p className="text-base font-semibold text-slate-900">
                                  {item.productName}
                                </p>
                                <p className="mt-1 text-sm text-slate-600">
                                  {item.quantity} x {formatMoney(item.unitPrice)}
                                </p>
                              </div>

                              <p className="text-base font-semibold text-slate-900 sm:text-right">
                                {formatMoney(item.lineTotal)}
                              </p>
                            </li>
                          ))}
                        </ul>
                      ) : null}
                    </article>
                  );
                })}
              </div>
            ) : (
              <div className="flex min-h-[440px] flex-col items-center justify-center px-4 py-10 text-center">
                <div className="flex h-32 w-32 items-center justify-center rounded-full border border-dashed border-slate-300 bg-slate-50">
                  <OrdersIcon />
                </div>

                <h2 className="mt-8 text-3xl font-semibold tracking-tight text-slate-900 sm:text-4xl">
                  Nu ai mai plasat comenzi de {selectedPeriod.toLowerCase()}
                </h2>
                <p className="mt-5 max-w-2xl text-base text-slate-600 sm:text-lg">
                  Poti modifica filtrul de mai sus ca sa vezi celelalte comenzi.
                </p>

                <Link
                  href="/products"
                  className="mt-10 inline-flex min-h-12 min-w-[220px] cursor-pointer items-center justify-center rounded-2xl border border-slate-900 bg-white px-6 py-3 text-base font-semibold text-slate-900 transition hover:bg-slate-50"
                >
                  Continua cumparaturile
                </Link>
              </div>
            )}
          </div>
        </section>
      </div>
    </main>
  );
}
