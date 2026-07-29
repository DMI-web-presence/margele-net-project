'use client';

import { useProductReviews } from '@/components/product-reviews-provider';

function Stars({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-0.5 text-amber-500" aria-label="Evaluare produs">
      {[1, 2, 3, 4, 5].map((star) => (
        <svg
          key={star}
          viewBox="0 0 24 24"
          className={`h-4 w-4 ${rating >= star ? 'fill-current' : 'fill-none text-slate-300'}`}
          stroke="currentColor"
          strokeWidth="1.8"
        >
          <path d="m12 3 2.7 5.5 6.1.9-4.4 4.3 1 6.1-5.4-2.9-5.4 2.9 1-6.1-4.4-4.3 6.1-.9L12 3Z" />
        </svg>
      ))}
    </div>
  );
}

export default function ReviewsSummary() {
  const { averageRating, reviewsCount, isLoading } = useProductReviews();
  const rounded = Math.round(averageRating);

  if (isLoading) {
    return <p className="text-sm text-slate-500">Se incarca recenziile...</p>;
  }

  return (
    <div className="flex items-center gap-2 text-sm text-slate-600">
      <Stars rating={rounded} />
      <span className="font-medium text-slate-700">{averageRating.toFixed(1)}</span>
      <span>({reviewsCount} recenzii)</span>
    </div>
  );
}
