'use client';

import { FormEvent, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useProductReviews } from '@/components/product-reviews-provider';

function Stars({ rating }: { rating: number }) {
  return (
    <span className="text-amber-500" aria-label={`Rating ${rating} din 5`}>
      {'★'.repeat(rating)}
      {'☆'.repeat(5 - rating)}
    </span>
  );
}

export default function ReviewsSection() {
  const { reviews, reviewsCount, averageRating, addReview } = useProductReviews();
  const [name, setName] = useState('');
  const [rating, setRating] = useState<number | null>(null);
  const [hoverRating, setHoverRating] = useState<number | null>(null);
  const [comment, setComment] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const trimmedName = name.trim();
    const trimmedComment = comment.trim();

    if (!trimmedName || !trimmedComment) {
      return;
    }
    if (rating == null) {
      setError('Te rugam sa selectezi numarul de stele inainte sa adaugi recenzia.');
      return;
    }
    setError('');

    addReview({ name: trimmedName, rating, comment: trimmedComment });
    setName('');
    setRating(null);
    setComment('');
  };

  return (
    <Card className="p-8">
      <div className="mb-6 flex items-center justify-between gap-3">
        <h2 className="text-lg font-semibold text-slate-900">Recenzii</h2>
        <div className="flex items-center gap-2 text-sm text-slate-600">
          <Stars rating={Math.round(averageRating)} />
          <span className="font-medium text-slate-800">{averageRating.toFixed(1)}</span>
          <span>({reviewsCount} recenzii)</span>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="grid gap-3 rounded-3xl bg-slate-50 p-4 sm:grid-cols-2">
        <input
          value={name}
          onChange={(event) => setName(event.target.value)}
          placeholder="Nume"
          className="rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm text-slate-900 outline-none focus:border-slate-400"
        />
        <div
          className="flex items-center gap-1 px-1 py-2"
          onMouseLeave={() => setHoverRating(null)}
        >
          {[1, 2, 3, 4, 5].map((star) => {
            const active = star <= (hoverRating ?? rating ?? 0);
            return (
              <button
                key={star}
                type="button"
                aria-label={`${star} stele`}
                aria-pressed={active}
                onClick={() => {
                  setRating(star);
                  setError('');
                }}
                onMouseEnter={() => setHoverRating(star)}
                className={`cursor-pointer text-3xl leading-none transition ${
                  active
                    ? 'scale-110 text-amber-500 drop-shadow-[0_0_6px_rgba(245,158,11,0.45)]'
                    : 'text-slate-300 hover:scale-105 hover:text-amber-400'
                }`}
              >
                ★
              </button>
            );
          })}
        </div>
        <textarea
          value={comment}
          onChange={(event) => setComment(event.target.value)}
          placeholder="Scrie recenzia ta..."
          rows={3}
          className="sm:col-span-2 rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm text-slate-900 outline-none focus:border-slate-400"
        />
        <div className="sm:col-span-2">
          <Button type="submit">Adauga recenzie</Button>
        </div>
        {error ? (
          <p className="sm:col-span-2 text-sm font-medium text-rose-600">{error}</p>
        ) : null}
      </form>

      <div className="mt-6 space-y-3">
        {reviews.map((review) => (
          <div key={review.id} className="rounded-2xl border border-slate-200 p-4">
            <div className="mb-2 flex items-center justify-between">
              <p className="font-semibold text-slate-900">{review.name}</p>
              <Stars rating={review.rating} />
            </div>
            <p className="text-sm text-slate-700">{review.comment}</p>
          </div>
        ))}
      </div>
    </Card>
  );
}
