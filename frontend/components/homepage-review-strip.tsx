'use client';

import { useEffect, useState } from 'react';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  type CarouselApi,
} from '@/components/ui/carousel';

const reviewSources = [
  {
    name: 'Google',
    rating: '5/5',
    href: 'https://www.google.com/search?q=margele+oradea',
    kind: 'google',
  },
  {
    name: 'Cylex Romania',
    rating: '4,5/5',
    href: 'https://www.cylex.ro/oradea/',
    kind: 'cylex',
  },
] as const;

const reviewHighlights = [
  {
    name: 'Eliza Anamaria',
    source: 'Google',
    rating: 5,
    quote:
      'Recomand cu incredere magazinul. Aici gasesti tot ce ai nevoie pentru proiectele tale creative, iar personalul este extrem de amabil.',
  },
  {
    name: 'Ionela Adina Tusai',
    source: 'Google',
    rating: 5,
    quote:
      'Seriozitate, amabilitate si profesionalism. Raport calitate-pret super ok, iar comenzile ajung repede.',
  },
  {
    name: 'Codruta Briscu',
    source: 'Google',
    rating: 5,
    quote:
      'Mereu atente si gata sa serveasca clientii. Cumpar de cativa ani si nu am fost niciodata dezamagita.',
  },
  {
    name: 'Iulia Sarmasan',
    source: 'Google',
    rating: 5,
    quote:
      'De fiecare data am o experienta placuta cumparand produsele magazinului si sunt multumita de produse. Va recomand sa incercati.',
  },
  {
    name: 'Carmen Mihai',
    source: 'Google',
    rating: 5,
    quote: 'Super. Servire impecabila. Recomand.',
  },
] as const;

function Stars({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-0.5 text-amber-500" aria-label={`${rating} din 5 stele`}>
      {[1, 2, 3, 4, 5].map((star) => (
        <svg
          key={star}
          aria-hidden="true"
          viewBox="0 0 24 24"
          className={`h-3.5 w-3.5 ${star <= rating ? 'fill-current' : 'fill-slate-200 text-slate-200'}`}
        >
          <path d="m12 2.8 2.8 5.7 6.3.9-4.6 4.5 1.1 6.3-5.6-3-5.6 3 1.1-6.3-4.6-4.5 6.3-.9L12 2.8Z" />
        </svg>
      ))}
    </div>
  );
}

function GoogleWordmark() {
  return (
    <span className="inline-flex items-center font-semibold tracking-tight">
      <span className="text-[#4285F4]">G</span>
      <span className="text-[#DB4437]">o</span>
      <span className="text-[#F4B400]">o</span>
      <span className="text-[#4285F4]">g</span>
      <span className="text-[#0F9D58]">l</span>
      <span className="text-[#DB4437]">e</span>
    </span>
  );
}

function ReviewAvatar({ name }: { name: string }) {
  const initial = name.trim().charAt(0).toUpperCase() || 'M';
  const palette = ['#7c3aed', '#2563eb', '#0f766e', '#b45309', '#be123c', '#475569'];
  const colorIndex =
    Array.from(name).reduce((sum, char) => sum + char.charCodeAt(0), 0) % palette.length;

  return (
    <div
      aria-hidden="true"
      className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-base font-bold text-white"
      style={{ backgroundColor: palette[colorIndex] }}
    >
      {initial}
    </div>
  );
}

function ExternalArrow() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className="h-4 w-4 fill-none stroke-current stroke-[1.9]">
      <path d="M14 5h5v5" />
      <path d="M10 14 19 5" />
      <path d="M19 13v4a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2h4" />
    </svg>
  );
}

function CylexBadge() {
  return (
    <span className="inline-flex h-4 w-4 items-center justify-center rounded-full bg-[radial-gradient(circle_at_30%_30%,#f8fbff_0%,#a7bde9_45%,#5e6fb2_100%)] text-[9px] font-bold text-white shadow-[0_0_0_1px_rgba(255,255,255,0.12)]">
      C
    </span>
  );
}

export default function HomepageReviewStrip() {
  const [api, setApi] = useState<CarouselApi>();
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [snapCount, setSnapCount] = useState(0);

  useEffect(() => {
    if (!api) return;

    const syncState = () => {
      setSelectedIndex(api.selectedScrollSnap());
      setSnapCount(api.scrollSnapList().length);
    };

    syncState();
    api.on('select', syncState);
    api.on('reInit', syncState);

    return () => {
      api.off('select', syncState);
      api.off('reInit', syncState);
    };
  }, [api]);

  return (
    <section className="mb-14 bg-white px-6 sm:px-6">
      <div className="mx-auto max-w-[1370px] rounded-[1.45rem] border border-slate-200 bg-[linear-gradient(135deg,#fff7fb_0%,#ffffff_42%,#f7f4ff_100%)] p-6 shadow-[0_12px_38px_rgba(15,23,42,0.06)] sm:p-7 lg:p-8">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl">
            <p className="text-xs font-bold uppercase tracking-[0.34em] text-[#7b4a75]">
              Ce spun clientii
            </p>
            <h2 className="mt-3 text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl">
              Recenzii care vorbesc pe bune despre experienta din magazin
            </h2>
            <p className="mt-3 text-sm font-medium leading-6 text-slate-600">
              Cateva impresii rapide din Google si Cylex Romania, utile atunci cand vrei un semnal
              de incredere inainte sa alegi produsele.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            {reviewSources.map((source) => (
              <a
                key={source.name}
                href={source.href}
                target="_blank"
                rel="noreferrer noopener"
                className="min-w-[182px] rounded-[1.4rem] border border-slate-200 bg-white px-4 py-3 text-slate-900 shadow-[0_8px_22px_rgba(15,23,42,0.04)] transition hover:-translate-y-0.5 hover:shadow-[0_12px_28px_rgba(15,23,42,0.08)]"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      {source.kind === 'google' ? (
                        <GoogleWordmark />
                      ) : (
                        <>
                          <CylexBadge />
                          <span className="truncate text-[0.95rem] font-semibold tracking-tight text-slate-900">
                            {source.name}
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                  <span className="mt-0.5 text-slate-500">
                    <ExternalArrow />
                  </span>
                </div>

                <div className="mt-4 flex items-end justify-between gap-4">
                  <p className="text-[2.1rem] font-medium leading-none tracking-tight text-slate-950">
                    {source.rating}
                  </p>
                </div>
              </a>
            ))}
          </div>
        </div>

        <div className="mt-7">
          <Carousel
            opts={{ align: 'start', loop: false }}
            setApi={setApi}
            className="w-full"
          >
            <CarouselContent className="items-stretch">
              {reviewHighlights.map((review) => (
                <CarouselItem
                  key={`${review.name}-${review.source}`}
                  className="basis-full md:basis-1/2 xl:basis-1/3"
                >
                  <article className="flex min-h-[13rem] flex-col rounded-[1.4rem] border border-slate-200 bg-white/90 p-5 shadow-[0_8px_22px_rgba(15,23,42,0.04)]">
                    <div className="flex items-start gap-3">
                      <ReviewAvatar name={review.name} />
                      <div className="min-w-0 flex-1">
                        <p className="text-base font-medium text-slate-950">{review.name}</p>
                        <p className="mt-0.5 text-xs text-slate-500">
                          Recenzie de la{' '}
                          {review.source === 'Google' ? <GoogleWordmark /> : <span>{review.source}</span>}
                        </p>
                      </div>
                    </div>

                    <div className="mt-4 flex items-center gap-2 text-sm">
                      <span className="font-semibold text-slate-950">{review.rating}/5</span>
                      <Stars rating={review.rating} />
                    </div>

                    <p className="mt-4 text-sm leading-7 text-slate-700">{review.quote}</p>
                  </article>
                </CarouselItem>
              ))}
            </CarouselContent>
          </Carousel>

          {snapCount > 1 ? (
            <div className="mt-5 flex items-center justify-center gap-2">
              {Array.from({ length: snapCount }, (_, index) => (
                <button
                  key={index}
                  type="button"
                  onClick={() => api?.scrollTo(index)}
                  aria-label={`Mergi la recenzia ${index + 1}`}
                  aria-current={selectedIndex === index ? 'true' : undefined}
                  className={`h-2.5 rounded-full transition ${
                    selectedIndex === index
                      ? 'w-8 bg-slate-900'
                      : 'w-2.5 bg-slate-300 hover:bg-slate-400'
                  }`}
                />
              ))}
            </div>
          ) : null}
        </div>
      </div>
    </section>
  );
}
