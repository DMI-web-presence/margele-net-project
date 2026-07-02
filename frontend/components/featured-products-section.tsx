'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useCart } from '@/components/cart-provider';
import ProductFavoriteIconButton from '@/components/product-favorite-icon-button';
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

type FeaturedProductsSectionProps = {
  products: Product[];
};

const mockProducts: Product[] = [
  {
    id: -101,
    name: 'Mix margele sticla pastel 8 mm',
    description: 'Nuante delicate pentru bratari, cadouri si accesorii handmade.',
    price: '18.50',
    imageUrl: '/landing-page-image.webp',
  },
  {
    id: -102,
    name: 'Pandantiv floare argintiu',
    description: 'Accesoriu metalic usor de integrat in coliere si martisoare.',
    price: '7.90',
    imageUrl: '/landing-page-image.webp',
  },
  {
    id: -103,
    name: 'Set perle decorative crem',
    description: 'Perle elegante pentru proiecte fine si decoratiuni de eveniment.',
    price: '24.00',
    imageUrl: '/landing-page-image.webp',
  },
  {
    id: -104,
    name: 'Snur cerat mov pentru bijuterii',
    description: 'Snur rezistent pentru bratari reglabile si coliere casual.',
    price: '12.50',
    imageUrl: '/landing-page-image.webp',
  },
  {
    id: -105,
    name: 'Charm steluta aurie',
    description: 'Detaliu luminos pentru bratari, cercei si ambalaje handmade.',
    price: '5.40',
    imageUrl: '/landing-page-image.webp',
  },
  {
    id: -106,
    name: 'Margele rosii pentru Craciun',
    description: 'Culoare intensa pentru decoratiuni festive si proiecte de sezon.',
    price: '16.90',
    imageUrl: '/landing-page-image.webp',
  },
];

const priceFormatter = new Intl.NumberFormat('ro-RO', {
  style: 'currency',
  currency: 'RON',
  currencyDisplay: 'narrowSymbol',
});

export default function FeaturedProductsSection({ products }: FeaturedProductsSectionProps) {
  const { addToCart } = useCart();
  const isUsingMockProducts = products.length === 0;
  const featuredProducts = (isUsingMockProducts ? mockProducts : products).slice(0, 8);

  return (
    <section className="bg-slate-50">
      <div className="mx-auto w-full max-w-[1400px] px-6 py-12 sm:px-10 lg:px-16">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.24em] text-[#7b4a75]">
              {isUsingMockProducts ? 'Preview produse recomandate' : 'Produse recomandate'}
            </p>
            <h2 className="mt-2 text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl">
              Selectii pentru creatii handmade
            </h2>
            {isUsingMockProducts ? (
              <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
                Aceste produse sunt demo, folosite doar ca sa vezi cum arata sectiunea pana cand
                produsele reale vin din PostgreSQL.
              </p>
            ) : null}
          </div>
          <Link
            href="/catalog"
            className="inline-flex min-h-11 items-center justify-center rounded-full border border-slate-300 bg-white px-5 text-sm font-semibold text-slate-900 transition hover:bg-slate-100"
          >
            Vezi toate produsele
          </Link>
        </div>

        <Carousel opts={{ align: 'start', loop: featuredProducts.length > 3 }} className="mt-7 w-full px-14">
          <CarouselContent>
            {featuredProducts.map((product) => (
              <CarouselItem
                key={product.id}
                className="basis-[82%] sm:basis-1/2 lg:basis-1/4"
              >
                <article className="flex min-h-[26rem] flex-col overflow-hidden rounded-[1.75rem] border border-slate-200 bg-white transition hover:-translate-y-1 hover:shadow-md">
                  {isUsingMockProducts ? (
                    <div className="border-b border-dashed border-slate-200 bg-[#f6e8f3] px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-[#7b4a75]">
                      Demo
                    </div>
                  ) : null}

                  <div className="relative border-b border-slate-100 bg-slate-100">
                    <Link
                      href={isUsingMockProducts ? '/catalog' : `/products/${product.id}`}
                      className="group block"
                    >
                      <div className="relative aspect-square">
                        {product.imageUrl ? (
                          <Image
                            src={product.imageUrl}
                            alt={product.name}
                            fill
                            sizes="(min-width: 1024px) 25vw, (min-width: 640px) 50vw, 100vw"
                            className="object-contain p-5 transition duration-300 group-hover:scale-105"
                            unoptimized
                          />
                        ) : (
                          <div className="flex h-full items-center justify-center text-sm text-slate-500">
                            Imagine indisponibila
                          </div>
                        )}
                      </div>
                    </Link>

                    {!isUsingMockProducts ? (
                      <div className="absolute right-3 top-3">
                        <ProductFavoriteIconButton
                          product={{
                            id: product.id,
                            name: product.name,
                            price: product.price,
                            imageUrl: product.imageUrl,
                          }}
                        />
                      </div>
                    ) : null}
                  </div>

                  <div className="flex flex-1 flex-col p-5">
                    <Link
                      href={isUsingMockProducts ? '/catalog' : `/products/${product.id}`}
                      className="line-clamp-2 min-h-14 text-base font-semibold leading-7 text-slate-950 transition hover:text-[#7b4a75]"
                    >
                      {product.name}
                    </Link>
                    <p className="mt-2 line-clamp-2 min-h-10 text-sm leading-5 text-slate-600">
                      {product.description ?? 'Material premium pentru proiecte handmade.'}
                    </p>

                    <div className="mt-auto flex items-end justify-between gap-3 pt-5">
                      <p className="text-xl font-semibold tracking-tight text-slate-950">
                        {priceFormatter.format(Number(product.price))}
                      </p>
                      <button
                        type="button"
                        disabled={isUsingMockProducts}
                        onClick={(event) =>
                          addToCart(
                            {
                              id: product.id,
                              name: product.name,
                              price: product.price,
                              imageUrl: product.imageUrl,
                            },
                            event.currentTarget,
                          )
                        }
                        className="inline-flex min-h-10 cursor-pointer items-center justify-center rounded-2xl bg-slate-900 px-4 text-sm font-semibold text-white transition hover:bg-[#7b4a75] disabled:cursor-not-allowed disabled:bg-slate-300"
                      >
                        {isUsingMockProducts ? 'Demo' : 'Adauga'}
                      </button>
                    </div>
                  </div>
                </article>
              </CarouselItem>
            ))}
          </CarouselContent>
          <CarouselPrevious className="left-0 top-1/2 hidden h-12 w-12 -translate-y-1/2 border-slate-200 bg-white text-slate-900 shadow-sm sm:inline-flex" />
          <CarouselNext className="right-0 top-1/2 hidden h-12 w-12 -translate-y-1/2 border-slate-200 bg-white text-slate-900 shadow-sm sm:inline-flex" />
        </Carousel>
      </div>
    </section>
  );
}
