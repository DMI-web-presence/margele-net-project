import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

function ProductCardSkeleton() {
  return (
    <Card className="flex h-full w-full flex-col overflow-hidden rounded-[2rem] border-slate-200">
      <Skeleton className="h-72 w-full rounded-none sm:h-65" />
      <div className="flex flex-1 flex-col space-y-3 p-4">
        <Skeleton className="h-5 w-4/5" />
        <Skeleton className="h-5 w-3/5" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-2/3" />
        <Skeleton className="h-3 w-1/2" />
      </div>
      <div className="flex items-center justify-between gap-2 border-t border-slate-200 px-4 py-6">
        <Skeleton className="h-8 w-24 rounded-lg" />
        <Skeleton className="h-9 w-28 rounded-xl" />
      </div>
    </Card>
  );
}

export function CatalogPageSkeleton({
  titleWidth = 'w-72',
}: {
  titleWidth?: string;
}) {
  return (
    <main className="px-10 py-8 sm:px-20 lg:px-32">
      <div className="space-y-8">
        <Card className="bg-slate-50 p-8 shadow-sm">
          <div className="max-w-2xl space-y-4">
            <Skeleton className="h-4 w-56" />
            <Skeleton className={`h-12 ${titleWidth} max-w-full rounded-xl`} />
            <Skeleton className="h-4 w-full max-w-xl" />
            <Skeleton className="h-4 w-4/5 max-w-xl" />
          </div>
        </Card>

        <section className="grid gap-6 lg:grid-cols-[17rem_1fr]">
          <aside className="h-fit rounded-3xl border border-slate-200 bg-white p-5 shadow-sm lg:sticky lg:top-24">
            <div className="space-y-5">
              <Skeleton className="h-10 w-full rounded-2xl" />
              <Skeleton className="h-10 w-full rounded-2xl" />
              <div className="space-y-2">
                {Array.from({ length: 8 }).map((_, index) => (
                  <Skeleton key={index} className="h-8 w-full rounded-xl" />
                ))}
              </div>
            </div>
          </aside>

          <div>
            <div className="flex items-center justify-between gap-4">
              <Skeleton className="h-5 w-36" />
              <Skeleton className="h-10 w-28 rounded-xl" />
            </div>
            <div className="mt-6 grid items-stretch gap-4 sm:grid-cols-2 lg:grid-cols-[repeat(auto-fill,minmax(15rem,1fr))]">
              {Array.from({ length: 8 }).map((_, index) => (
                <ProductCardSkeleton key={index} />
              ))}
            </div>
            <Skeleton className="mt-6 h-12 w-full rounded-lg" />
          </div>
        </section>
      </div>
    </main>
  );
}

export function HomePageSkeleton() {
  return (
    <main>
      <section className="mb-14 mt-6 bg-white px-6 sm:px-10 lg:px-16">
        <div className="mx-auto max-w-[1370px] overflow-hidden rounded-[1.45rem] border border-slate-200 bg-white shadow-[0_14px_45px_rgba(15,23,42,0.08)]">
          <div className="grid min-h-[430px] lg:grid-cols-[49%_51%]">
            <div className="flex flex-col justify-between p-7 sm:p-10 lg:p-11">
              <div className="max-w-[470px] space-y-5">
                <Skeleton className="h-4 w-28" />
                <Skeleton className="h-14 w-full rounded-xl" />
                <Skeleton className="h-14 w-4/5 rounded-xl" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-11/12" />
                <Skeleton className="h-12 w-48 rounded-full" />
              </div>
              <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
                {Array.from({ length: 4 }).map((_, index) => (
                  <div key={index} className="space-y-3">
                    <Skeleton className="h-8 w-8 rounded-full" />
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-3 w-full" />
                  </div>
                ))}
              </div>
            </div>
            <Skeleton className="min-h-[320px] rounded-none lg:min-h-full" />
          </div>
        </div>
      </section>
      <section className="mb-14 px-6 sm:px-10 lg:px-16">
        <div className="mx-auto max-w-[1370px] rounded-[1.45rem] border border-slate-200 bg-white p-5 shadow-[0_10px_35px_rgba(15,23,42,0.06)]">
          <Skeleton className="h-4 w-64" />
          <div className="mt-4 grid gap-5 lg:grid-cols-3">
            {Array.from({ length: 3 }).map((_, index) => (
              <div key={index} className="rounded-xl border border-slate-200 bg-white p-3">
                <Skeleton className="h-[154px] w-full rounded-lg" />
                <Skeleton className="mt-4 h-6 w-2/3" />
                <Skeleton className="mt-3 h-4 w-full" />
                <Skeleton className="mt-2 h-4 w-4/5" />
              </div>
            ))}
          </div>
        </div>
      </section>
      <CarouselSectionSkeleton />
      <CarouselSectionSkeleton />
    </main>
  );
}

function CarouselSectionSkeleton() {
  return (
    <section className="mb-14 bg-white p-6">
      <div className="mx-auto flex w-full max-w-[1400px] flex-col items-center gap-7 px-6 sm:px-10 lg:px-16">
        <div className="flex min-h-[11rem] max-w-3xl flex-col items-center justify-center gap-4 text-center">
          <Skeleton className="h-4 w-40" />
          <Skeleton className="h-10 w-80 max-w-full rounded-xl" />
          <Skeleton className="h-4 w-full max-w-2xl" />
          <Skeleton className="h-12 w-40 rounded-full" />
        </div>
        <div className="grid w-full max-w-[1280px] gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <ProductCardSkeleton key={index} />
          ))}
        </div>
      </div>
    </section>
  );
}

export function ProductPageSkeleton() {
  return (
    <main className="px-6 py-8 sm:px-10 lg:px-54">
      <div className="mx-auto mb-8 flex w-full max-w-5xl flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <Skeleton className="h-4 w-40" />
        <Skeleton className="h-10 w-36 rounded-2xl" />
      </div>
      <div className="mx-auto w-full max-w-5xl space-y-6">
        <div className="grid items-start gap-8 xl:grid-cols-[0.8fr_1.2fr]">
          <Skeleton className="aspect-square max-h-[34rem] rounded-3xl" />
          <Card className="space-y-6 p-8">
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-5 w-44" />
            <Skeleton className="h-10 w-full rounded-xl" />
            <Skeleton className="h-10 w-2/3 rounded-xl" />
            <div className="grid gap-4 sm:grid-cols-2">
              <Skeleton className="h-16 rounded-2xl" />
              <Skeleton className="h-16 rounded-2xl" />
            </div>
            <Skeleton className="h-12 w-48 rounded-2xl" />
          </Card>
        </div>
        <Skeleton className="h-56 w-full rounded-3xl" />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, index) => (
            <ProductCardSkeleton key={index} />
          ))}
        </div>
      </div>
    </main>
  );
}

export function BasketPageSkeleton() {
  return (
    <main className="px-6 py-10 sm:px-10 lg:px-16">
      <section className="mx-auto grid max-w-[1200px] gap-6 lg:grid-cols-[1fr_23rem]">
        <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
          <Skeleton className="h-10 w-48 rounded-xl" />
          <div className="mt-8 space-y-4">
            {Array.from({ length: 3 }).map((_, index) => (
              <div key={index} className="grid gap-4 rounded-2xl border border-slate-200 p-4 sm:grid-cols-[6rem_1fr_auto]">
                <Skeleton className="h-24 w-24 rounded-2xl" />
                <div className="space-y-3">
                  <Skeleton className="h-5 w-3/4" />
                  <Skeleton className="h-4 w-1/2" />
                  <Skeleton className="h-10 w-36 rounded-xl" />
                </div>
                <Skeleton className="h-7 w-24 rounded-lg" />
              </div>
            ))}
          </div>
        </div>
        <div className="h-fit rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
          <Skeleton className="h-8 w-32 rounded-xl" />
          <div className="mt-6 space-y-4">
            <Skeleton className="h-5 w-full" />
            <Skeleton className="h-5 w-5/6" />
            <Skeleton className="h-12 w-full rounded-2xl" />
          </div>
        </div>
      </section>
    </main>
  );
}
