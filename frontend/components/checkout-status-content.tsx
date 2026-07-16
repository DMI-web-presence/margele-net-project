'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';

type Order = {
  orderNumber: string;
  status: string;
  paymentStatus?: string | null;
  paymentError?: string | null;
  total: string;
  currency: string;
};

const backendUrl =
  process.env.NEXT_PUBLIC_BACKEND_URL ?? 'http://localhost:3001';

const currencyFormatter = new Intl.NumberFormat('ro-RO', {
  style: 'currency',
  currency: 'RON',
  currencyDisplay: 'narrowSymbol',
});

function statusCopy(order: Order | null) {
  if (!order) {
    return {
      title: 'Se verifica plata',
      body: 'Asteptam confirmarea procesatorului de plata.',
      tone: 'text-slate-900',
    };
  }

  if (order.paymentStatus === 'paid') {
    return {
      title: 'Plata a fost confirmata',
      body: 'Comanda ta este inregistrata si va fi pregatita pentru livrare.',
      tone: 'text-emerald-700',
    };
  }

  if (order.paymentStatus === 'failed' || order.paymentStatus === 'cancelled') {
    return {
      title: 'Plata nu a fost finalizata',
      body: order.paymentError || 'Nu am primit confirmarea platii. Poti incerca din nou din cos.',
      tone: 'text-red-700',
    };
  }

  return {
    title: 'Plata este in curs de confirmare',
    body: 'Daca ai finalizat plata, confirmarea poate dura cateva momente. Verifica pagina de comenzi pentru statusul actualizat.',
    tone: 'text-amber-700',
  };
}

export default function CheckoutStatusContent() {
  const searchParams = useSearchParams();
  const orderNumber = searchParams.get('orderNumber') || '';
  const [order, setOrder] = useState<Order | null>(null);
  const [isLoading, setIsLoading] = useState(Boolean(orderNumber));
  const [error, setError] = useState('');
  const copy = useMemo(() => statusCopy(order), [order]);

  useEffect(() => {
    if (!orderNumber) {
      setIsLoading(false);
      setError('Lipseste numarul comenzii.');
      return;
    }

    const loadOrder = async () => {
      setIsLoading(true);
      setError('');

      try {
        const response = await fetch(`${backendUrl}/auth/orders/${encodeURIComponent(orderNumber)}`, {
          credentials: 'include',
        });
        const result = (await response.json().catch(() => null)) as Order | { message?: string } | null;
        if (!response.ok) {
          throw new Error(result && 'message' in result && result.message ? result.message : 'Nu am putut verifica plata.');
        }

        setOrder(result as Order);
      } catch (loadError) {
        setError(loadError instanceof Error ? loadError.message : 'Nu am putut verifica plata.');
      } finally {
        setIsLoading(false);
      }
    };

    void loadOrder();
  }, [orderNumber]);

  return (
    <main className="px-6 py-16 sm:px-10 lg:px-16">
      <section className="mx-auto max-w-2xl rounded-[2rem] border border-slate-200 bg-white p-8 shadow-sm">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">
          Status plata
        </p>
        <h1 className={`mt-3 text-4xl font-semibold tracking-tight ${copy.tone}`}>
          {isLoading ? 'Se verifica plata...' : error || copy.title}
        </h1>
        <p className="mt-4 text-base leading-7 text-slate-600">
          {error ? 'Te rugam sa verifici pagina de comenzi sau sa incerci din nou.' : copy.body}
        </p>

        {order ? (
          <div className="mt-6 rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700">
            <p className="font-semibold text-slate-900">{order.orderNumber}</p>
            <p className="mt-1">Status comanda: {order.status}</p>
            <p className="mt-1">Total: {currencyFormatter.format(Number(order.total || 0))}</p>
          </div>
        ) : null}

        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <Link
            href="/cont/comenzi"
            className="inline-flex min-h-12 items-center justify-center rounded-2xl bg-slate-900 px-6 py-3 text-base font-semibold text-white transition hover:bg-black"
          >
            Vezi comenzile
          </Link>
          <Link
            href="/catalog"
            className="inline-flex min-h-12 items-center justify-center rounded-2xl border border-slate-300 bg-white px-6 py-3 text-base font-semibold text-slate-900 transition hover:bg-slate-50"
          >
            Continua cumparaturile
          </Link>
        </div>
      </section>
    </main>
  );
}
