'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
  type CarouselApi,
} from '@/components/ui/carousel';

type Product = {
  id: number;
  name: string;
  description: string | null;
  price: string;
  imageUrl: string | null;
};

type LandingProductCarouselProps = {
  title: string;
  products: Product[];
};

const priceFormatter = new Intl.NumberFormat('ro-RO', {
  style: 'currency',
  currency: 'RON',
  currencyDisplay: 'narrowSymbol',
});

export default function LandingProductCarousel({
  title,
  products,
}: LandingProductCarouselProps) {
  const [api, setApi] = useState<CarouselApi>();

  useEffect(() => {
    if (!api || products.length <= 1) return;

    const interval = window.setInterval(() => {
      api.scrollNext();
    }, 3200);

    return () => window.clearInterval(interval);
  }, [api, products.length]);

  if (products.length === 0) {
    return null;
  }

  return (
    <section className="flex flex-col gap-4">
      <div className="flex items-center justify-between gap-4">
        <h2 className="text-2xl font-semibold tracking-tight text-slate-950">{title}</h2>
        <Link href="/catalog" className="text-sm font-semibold text-[#7b4a75] transition hover:text-[#663b61]">
          Vezi toate
        </Link>
      </div>

      <Carousel opts={{ align: 'start', loop: true }} setApi={setApi} className="w-full">
        <CarouselContent>
          {products.map((product) => (
            <CarouselItem key={`${title}-${product.id}`} className="basis-[78%] sm:basis-1/2 lg:basis-1/4">
              <Card className="h-full overflow-hidden rounded-2xl border-slate-200 bg-white transition hover:-translate-y-1 hover:shadow-md">
                <Link href={`/products/${product.id}`} className="block">
                  {product.imageUrl ? (
                    <div className="relative aspect-square bg-slate-100">
                      <Image
                        src={product.imageUrl}
                        alt={product.name}
                        fill
                        className="object-contain p-4 transition duration-300 hover:scale-105"
                        unoptimized
                      />
                    </div>
                  ) : (
                    <div className="flex aspect-square items-center justify-center bg-slate-100 text-sm text-slate-500">
                      Imagine indisponibila
                    </div>
                  )}
                </Link>
                <div className="flex min-h-36 flex-col gap-2 p-4">
                  <Link
                    href={`/products/${product.id}`}
                    className="line-clamp-2 text-sm font-semibold text-slate-950 transition hover:text-[#7b4a75]"
                  >
                    {product.name}
                  </Link>
                  <p className="line-clamp-1 text-xs text-slate-600">{product.description ?? 'Material premium'}</p>
                  <p className="mt-auto text-base font-semibold text-slate-950">
                    {priceFormatter.format(Number(product.price))}
                  </p>
                </div>
              </Card>
            </CarouselItem>
          ))}
        </CarouselContent>
        <CarouselPrevious className="-left-5 top-1/2 hidden h-12 w-12 -translate-y-1/2 text-xl sm:inline-flex" />
        <CarouselNext className="-right-5 top-1/2 hidden h-12 w-12 -translate-y-1/2 text-xl sm:inline-flex" />
      </Carousel>
    </section>
  );
}
