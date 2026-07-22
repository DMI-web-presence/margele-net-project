'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import ProductFavoriteIconButton from '@/components/product-favorite-icon-button';
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
  eyebrow?: string;
  description?: string;
  sectionId?: string;
  variant?: 'recommended' | 'fresh' | 'popular';
  accentLabel?: string;
  ctaLabel?: string;
  ctaHref?: string;
};

const priceFormatter = new Intl.NumberFormat('ro-RO', {
  style: 'currency',
  currency: 'RON',
  currencyDisplay: 'narrowSymbol',
});

const carouselMotion = {
  recommended: {
    delay: 3600,
    duration: 28,
  },
  fresh: {
    delay: 2600,
    duration: 20,
  },
  popular: {
    delay: 4600,
    duration: 36,
  },
} satisfies Record<NonNullable<LandingProductCarouselProps['variant']>, { delay: number; duration: number }>;

export default function LandingProductCarousel({
  title,
  products,
  eyebrow,
  description,
  sectionId,
  variant = 'recommended',
  accentLabel,
  ctaLabel = 'Vezi toate',
  ctaHref = '/catalog',
}: LandingProductCarouselProps) {
  const [api, setApi] = useState<CarouselApi>();
  const motion = carouselMotion[variant];

  useEffect(() => {
    if (!api || products.length <= 1) return;

    const interval = window.setInterval(() => {
      if (document.hidden) return;
      api.scrollNext();
    }, motion.delay);

    return () => window.clearInterval(interval);
  }, [api, motion.delay, products.length]);

  if (products.length === 0) {
    return null;
  }

  const isPopular = variant === 'popular';
  const isFresh = variant === 'fresh';

  return (
    <section
      id={sectionId}
      className={[
        'mb-14 p-6',
        isPopular
          ? 'bg-white text-slate-950'
          : isFresh
            ? 'border-y border-[#eadfce] bg-[#fbf7f1]'
            : 'bg-white',
      ].join(' ')}
    >
      <div className="mx-auto flex w-full max-w-[1400px] flex-col items-center justify-center gap-7 px-6 sm:px-10 lg:px-16">
        <div className="flex min-h-[11rem] max-w-3xl flex-col items-center justify-center gap-5 text-center">
          <div className="flex flex-col items-center justify-center">
            <div className="flex flex-wrap items-center justify-center gap-3">
              {eyebrow ? (
                <p
                  className={[
                    'text-xs font-bold uppercase tracking-[0.16em]',
                    'text-[#7b4a75]',
                  ].join(' ')}
                >
                  {eyebrow}
                </p>
              ) : null}
              {accentLabel ? (
                <span
                  className={[
                    'rounded-full px-3 py-1 text-xs font-bold',
                    'bg-violet-50 text-[#6437f3]',
                  ].join(' ')}
                >
                  {accentLabel}
                </span>
              ) : null}
            </div>
            <h2
              className={[
                'mt-3 text-3xl font-bold tracking-tight sm:text-4xl',
                'text-slate-950',
              ].join(' ')}
            >
              {title}
            </h2>
            {description ? (
              <p
                className={[
                  'mt-3 max-w-2xl text-sm leading-6',
                  isPopular ? 'text-[#6e5a45]' : 'text-slate-600',
                ].join(' ')}
              >
                {description}
              </p>
            ) : null}
          </div>

          <Link
            href={ctaHref}
            className={[
              'group inline-flex h-12 w-fit items-center justify-center gap-3 rounded-full bg-[#6437f3] px-6 text-sm font-bold text-white shadow-[0_12px_25px_rgba(100,55,243,0.25)] transition hover:bg-[#542ce1]',
            ].join(' ')}
          >
            {ctaLabel}
            <svg
              aria-hidden="true"
              viewBox="0 0 24 24"
              className="h-4 w-4 transition-transform duration-200 ease-out group-hover:translate-x-1"
            >
              <path d="M5 12h14M13 6l6 6-6 6" className="fill-none stroke-current stroke-2" />
            </svg>
          </Link>
        </div>

        <Carousel
          opts={{ align: 'start', loop: true, duration: motion.duration }}
          setApi={setApi}
          className="w-full max-w-[1280px] self-center"
        >
          <CarouselContent className="items-stretch">
            {products.map((product) => (
              <CarouselItem
                key={`${title}-${product.id}`}
                className="flex basis-[78%] sm:basis-1/2 lg:basis-1/4"
              >
                <Card className="flex h-full w-full flex-col overflow-hidden rounded-2xl border-slate-200 bg-white transition hover:-translate-y-1 hover:shadow-lg">
                  <div className="relative">
                    <Link href={`/products/${product.id}`} className="block">
                      {product.imageUrl ? (
                        <div
                          className={[
                            'h-64 w-full overflow-hidden',
                            isFresh ? 'bg-[#fdf7f0]' : 'bg-white',
                          ].join(' ')}
                        >
                          <img
                            src={product.imageUrl}
                            alt={product.name}
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
                          id: product.id,
                          name: product.name,
                          price: product.price,
                          imageUrl: product.imageUrl,
                        }}
                      />
                    </div>
                  </div>
                  <div className="flex min-h-36 flex-1 flex-col gap-2 p-4">
                    <Link
                      href={`/products/${product.id}`}
                      className="line-clamp-2 text-sm font-semibold text-slate-950 transition hover:text-[#6437f3]"
                    >
                      {product.name}
                    </Link>
                    <p className="line-clamp-1 text-xs text-slate-600">
                      {product.description ?? 'Material premium'}
                    </p>
                    <p className="mt-auto text-base font-bold text-slate-950">
                      {priceFormatter.format(Number(product.price))}
                    </p>
                  </div>
                </Card>
              </CarouselItem>
            ))}
          </CarouselContent>
          <CarouselPrevious
            className={[
              'left-0 top-[45%] z-10 hidden h-12 w-12 -translate-x-1/2 -translate-y-1/2 text-xl sm:inline-flex',
              isPopular ? 'border-[#e2cfbb] bg-white text-[#7d5835] hover:bg-[#f4e4d2]' : '',
            ].join(' ')}
          />
          <CarouselNext
            className={[
              'right-0 top-[45%] z-10 hidden h-12 w-12 translate-x-1/2 -translate-y-1/2 text-xl sm:inline-flex',
              isPopular ? 'border-[#e2cfbb] bg-white text-[#7d5835] hover:bg-[#f4e4d2]' : '',
            ].join(' ')}
          />
        </Carousel>
      </div>
    </section>
  );
}
