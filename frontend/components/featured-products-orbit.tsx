'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';

type Product = {
  id: number;
  name: string;
  description: string | null;
  price: string;
  imageUrl: string | null;
};

type FeaturedProductsOrbitProps = {
  title: string;
  products: Product[];
};

const priceFormatter = new Intl.NumberFormat('ro-RO', {
  style: 'currency',
  currency: 'RON',
  currencyDisplay: 'narrowSymbol',
});

const orbitPositions = [
  'left-[8%] top-[42%] -translate-y-1/2 scale-75 opacity-55',
  'left-[25%] top-[22%] -translate-y-1/2 scale-85 opacity-70',
  'right-[25%] top-[22%] -translate-y-1/2 scale-85 opacity-70',
  'right-[8%] top-[42%] -translate-y-1/2 scale-75 opacity-55',
];

export default function FeaturedProductsOrbit({
  title,
  products,
}: FeaturedProductsOrbitProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const activeProduct = products[activeIndex];

  const orbitProducts = useMemo(() => {
    if (products.length <= 1) return [];

    return orbitPositions.map((_, index) => products[(activeIndex + index + 1) % products.length]);
  }, [activeIndex, products]);

  useEffect(() => {
    if (products.length <= 1) return;

    const interval = window.setInterval(() => {
      setActiveIndex((current) => (current + 1) % products.length);
    }, 4200);

    return () => window.clearInterval(interval);
  }, [products.length]);

  if (!activeProduct) {
    return null;
  }

  const goPrevious = () => {
    setActiveIndex((current) => (current - 1 + products.length) % products.length);
  };

  const goNext = () => {
    setActiveIndex((current) => (current + 1) % products.length);
  };

  return (
    <section className="overflow-hidden rounded-[2rem] bg-white px-5 py-10 shadow-sm ring-1 ring-slate-200 sm:px-8">
      <div className="mx-auto flex max-w-5xl flex-col items-center text-center">
        <h2 className="text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl">{title}</h2>
        <p className="mt-2 max-w-xl text-sm leading-6 text-slate-600">
          Descopera cele mai noi produse adaugate in colectia Margele.net.
        </p>

        <div className="relative mt-8 h-[27rem] w-full">
          <div className="absolute left-1/2 top-[42%] hidden h-28 w-[72%] -translate-x-1/2 -translate-y-1/2 rounded-[50%] border-t-4 border-slate-100 md:block" />

          <button
            type="button"
            onClick={goPrevious}
            className="absolute left-0 top-[42%] z-20 inline-flex h-12 w-12 -translate-y-1/2 cursor-pointer items-center justify-center rounded-full bg-slate-950 text-xl font-semibold text-white transition hover:bg-[#7b4a75]"
            aria-label="Produs anterior"
          >
            ‹
          </button>

          <button
            type="button"
            onClick={goNext}
            className="absolute right-0 top-[42%] z-20 inline-flex h-12 w-12 -translate-y-1/2 cursor-pointer items-center justify-center rounded-full bg-slate-950 text-xl font-semibold text-white transition hover:bg-[#7b4a75]"
            aria-label="Produs urmator"
          >
            ›
          </button>

          <div className="absolute inset-x-16 top-0 hidden h-64 md:block">
            {orbitProducts.map((product, index) => (
              <button
                key={`${product.id}-${index}`}
                type="button"
                onClick={() => setActiveIndex(products.findIndex((item) => item.id === product.id))}
                className={`absolute flex h-28 w-28 cursor-pointer items-center justify-center rounded-full bg-slate-50 transition duration-500 hover:opacity-100 ${orbitPositions[index]}`}
                aria-label={`Selecteaza ${product.name}`}
              >
                {product.imageUrl ? (
                  <Image
                    src={product.imageUrl}
                    alt={product.name}
                    width={160}
                    height={160}
                    className="max-h-24 w-auto rounded-full object-contain"
                    unoptimized
                  />
                ) : (
                  <span className="text-xs text-slate-400">Imagine</span>
                )}
              </button>
            ))}
          </div>

          <div className="absolute left-1/2 top-[42%] z-10 flex h-40 w-40 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border-2 border-[#7b4a75] bg-white shadow-xl">
            {activeProduct.imageUrl ? (
              <Image
                src={activeProduct.imageUrl}
                alt={activeProduct.name}
                width={260}
                height={260}
                className="max-h-32 w-auto rounded-full object-contain"
                unoptimized
              />
            ) : (
              <span className="text-sm text-slate-400">Imagine indisponibila</span>
            )}
          </div>

          <div className="absolute bottom-0 left-1/2 flex w-full max-w-xl -translate-x-1/2 flex-col items-center">
            <div className="h-0 w-0 border-x-[6px] border-b-[10px] border-x-transparent border-b-[#7b4a75]" />
            <Link
              href={`/products/${activeProduct.id}`}
              className="mt-5 line-clamp-2 text-2xl font-semibold tracking-tight text-slate-950 transition hover:text-[#7b4a75]"
            >
              {activeProduct.name}
            </Link>
            <div className="mt-4 grid w-full max-w-sm grid-cols-2 divide-x divide-slate-200">
              <div>
                <p className="text-xs font-medium text-slate-500">Pret</p>
                <p className="mt-1 text-2xl font-semibold text-slate-950">
                  {priceFormatter.format(Number(activeProduct.price))}
                </p>
              </div>
              <div>
                <p className="text-xs font-medium text-slate-500">Material</p>
                <p className="mt-1 truncate text-lg font-semibold text-[#7b4a75]">
                  {activeProduct.description ?? 'Premium'}
                </p>
              </div>
            </div>
            <Link
              href={`/products/${activeProduct.id}`}
              className="mt-5 inline-flex items-center rounded-full bg-[#7b4a75] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#663b61]"
            >
              Vezi produsul
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
