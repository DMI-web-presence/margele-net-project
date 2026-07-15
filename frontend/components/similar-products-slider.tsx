'use client';

import Link from 'next/link';
import ProductFavoriteIconButton from '@/components/product-favorite-icon-button';
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
        <CarouselContent className="items-stretch">
          {products.map((item) => (
            <CarouselItem
              key={item.id}
              className="flex basis-full sm:basis-1/2 lg:basis-1/3"
            >
              <Card className="flex h-full w-full flex-col overflow-hidden rounded-3xl border-slate-200">
                <div className="relative">
                  <Link href={`/products/${item.id}`} className="block">
                    {item.imageUrl ? (
                      <div className="h-64 w-full overflow-hidden bg-white">
                        <img
                          src={item.imageUrl}
                          alt={item.name}
                          className="block h-full w-full object-cover object-center transition duration-300 hover:scale-[1.02]"
                        />
                      </div>
                    ) : (
                      <div className="flex h-64 items-center justify-center bg-slate-100 text-sm text-slate-500">
                        Imagine indisponibila
                      </div>
                    )}
                  </Link>
                  <div className="absolute right-3 top-3">
                    <ProductFavoriteIconButton
                      product={{
                        id: item.id,
                        name: item.name,
                        price: item.price,
                        imageUrl: item.imageUrl,
                      }}
                    />
                  </div>
                </div>

                <div className="flex flex-1 flex-col gap-2 p-4">
                  <Link
                    href={`/products/${item.id}`}
                    className="line-clamp-2 text-base font-semibold text-slate-900 transition hover:text-indigo-600"
                  >
                    {item.name}
                  </Link>
                  <p className="line-clamp-2 text-sm text-slate-600">
                    {item.description ?? 'Material premium'}
                  </p>
                  <p className="mt-auto text-base font-semibold text-slate-900">
                    {priceFormatter.format(Number(item.price))}
                  </p>
                </div>
              </Card>
            </CarouselItem>
          ))}
        </CarouselContent>
        <CarouselPrevious className="left-0 top-[40%] z-10 -translate-x-1/2 -translate-y-1/2" />
        <CarouselNext className="right-0 top-[40%] z-10 translate-x-1/2 -translate-y-1/2" />
      </Carousel>
    </section>
  );
}
