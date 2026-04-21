'use client';

import { useProductReviews } from '@/components/product-reviews-provider';

function Stars({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-0.5 text-amber-500" aria-label="Evaluare produs">
      <span>{rating >= 1 ? '★' : '☆'}</span>
      <span>{rating >= 2 ? '★' : '☆'}</span>
      <span>{rating >= 3 ? '★' : '☆'}</span>
      <span>{rating >= 4 ? '★' : '☆'}</span>
      <span>{rating >= 5 ? '★' : '☆'}</span>
    </div>
  );
}

export default function ReviewsSummary() {
  const { averageRating, reviewsCount } = useProductReviews();
  const rounded = Math.round(averageRating);

  return (
    <div className="flex items-center gap-2 text-sm text-slate-600">
      <Stars rating={rounded} />
      <span className="font-medium text-slate-700">{averageRating.toFixed(1)}</span>
      <span>({reviewsCount} recenzii)</span>
    </div>
  );
}
