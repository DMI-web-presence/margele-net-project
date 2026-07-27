import { Suspense } from 'react';
import CheckoutStatusContent from '@/components/checkout-status-content';
import { Skeleton } from '@/components/ui/skeleton';

function CheckoutStatusSkeleton() {
  return (
    <main className="px-6 py-16 sm:px-10 lg:px-16">
      <section className="mx-auto max-w-2xl rounded-[2rem] border border-slate-200 bg-white p-8 shadow-sm">
        <Skeleton className="h-4 w-36" />
        <Skeleton className="mt-4 h-11 w-full rounded-xl" />
        <Skeleton className="mt-3 h-11 w-3/4 rounded-xl" />
        <Skeleton className="mt-4 h-4 w-full" />
        <Skeleton className="mt-2 h-4 w-4/5" />
        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <Skeleton className="h-12 w-40 rounded-2xl" />
          <Skeleton className="h-12 w-48 rounded-2xl" />
        </div>
      </section>
    </main>
  );
}

export default function CheckoutStatusPage() {
  return (
    <Suspense fallback={<CheckoutStatusSkeleton />}>
      <CheckoutStatusContent />
    </Suspense>
  );
}
