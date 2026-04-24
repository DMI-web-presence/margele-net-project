'use client';

import Link from 'next/link';
import { useState } from 'react';
import AccountSidebar from '@/components/account-sidebar';

const orderPeriods = [
  'Din ultimele 6 luni',
  'Din ultimele 12 luni',
  'Din ultimii 2 ani',
  'Toate comenzile',
] as const;

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

export default function ContComenziPage() {
  const [selectedPeriod, setSelectedPeriod] =
    useState<(typeof orderPeriods)[number]>('Din ultimele 6 luni');

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
                    onChange={(event) =>
                      setSelectedPeriod(event.target.value as (typeof orderPeriods)[number])
                    }
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
          </div>
        </section>
      </div>
    </main>
  );
}
