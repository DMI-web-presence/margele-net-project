'use client';

import Image from 'next/image';
import Link from 'next/link';
import { Card } from '@/components/ui/card';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from '@/components/ui/carousel';

type Product = {
  id: number;
  name: string;
  description: string | null;
  price: string;
  imageUrl: string | null;
};

type SimilarProductsSliderProps = {
  products: Product[];
};

const priceFormatter = new Intl.NumberFormat('ro-RO', {
  style: 'currency',
  currency: 'RON',
  currencyDisplay: 'narrowSymbol',
});

export default function SimilarProductsSlider({
  products,
}: SimilarProductsSliderProps) {
  if (products.length === 0) {
    return null;
  }

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-slate-900">Produse asemanatoare</h2>
      </div>

      <Carousel
        opts={{
          align: 'start',
          loop: true,
        }}
        className="w-full"
      >
        <CarouselContent>
          {products.map((item) => (
            <CarouselItem
              key={item.id}
              className="basis-full sm:basis-1/2 lg:basis-1/3"
            >
              <Card className="h-full overflow-hidden rounded-3xl border-slate-200">
                <Link href={`/products/${item.id}`} className="block">
                  {item.imageUrl ? (
                    <div className="relative aspect-square bg-slate-100">
                      <Image
                        src={item.imageUrl}
                        alt={item.name}
                        fill
                        className="object-contain p-4"
                        unoptimized
                      />
                    </div>
                  ) : (
                    <div className="flex aspect-square items-center justify-center bg-slate-100 text-sm text-slate-500">
                      Imagine indisponibila
                    </div>
                  )}
                </Link>

                <div className="space-y-2 p-4">
                  <Link
                    href={`/products/${item.id}`}
                    className="line-clamp-2 text-base font-semibold text-slate-900 transition hover:text-indigo-600"
                  >
                    {item.name}
                  </Link>
                  <p className="line-clamp-2 text-sm text-slate-600">
                    {item.description ?? 'Material premium'}
                  </p>
                  <p className="text-base font-semibold text-slate-900">
                    {priceFormatter.format(Number(item.price))}
                  </p>
                </div>
              </Card>
            </CarouselItem>
          ))}
        </CarouselContent>
        <CarouselPrevious />
        <CarouselNext />
      </Carousel>
    </section>
  );
}
