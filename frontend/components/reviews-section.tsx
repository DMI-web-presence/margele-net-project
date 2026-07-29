'use client';

import { FormEvent, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useProductReviews } from '@/components/product-reviews-provider';

function Stars({ rating }: { rating: number }) {
  return (
    <span className="inline-flex items-center gap-0.5 text-amber-500" aria-label={`Rating ${rating} din 5`}>
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
    </span>
  );
}

function StarIcon({ filled }: { filled: boolean }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={`h-7 w-7 ${filled ? 'fill-current' : 'fill-none'}`}
      stroke="currentColor"
      strokeWidth="1.8"
    >
      <path d="m12 3 2.7 5.5 6.1.9-4.4 4.3 1 6.1-5.4-2.9-5.4 2.9 1-6.1-4.4-4.3 6.1-.9L12 3Z" />
    </svg>
  );
}

export default function ReviewsSection() {
  const {
    reviews,
    reviewsCount,
    averageRating,
    isLoading,
    isSubmitting,
    message,
    error,
    addReview,
    clearReviewFeedback,
  } = useProductReviews();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [rating, setRating] = useState<number | null>(null);
  const [hoverRating, setHoverRating] = useState<number | null>(null);
  const [comment, setComment] = useState('');
  const [formError, setFormError] = useState('');
  const [formStartedAt, setFormStartedAt] = useState(0);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const trimmedName = name.trim();
    const trimmedEmail = email.trim();
    const trimmedComment = comment.trim();

    if (!trimmedName || !trimmedEmail || !trimmedComment) {
      setFormError('Completeaza numele, emailul si recenzia.');
      return;
    }
    if (rating == null) {
      setFormError('Te rugam sa selectezi numarul de stele inainte sa adaugi recenzia.');
      return;
    }

    setFormError('');
    const submitted = await addReview({
      name: trimmedName,
      email: trimmedEmail,
      rating,
      comment: trimmedComment,
      formStartedAt,
    });

    if (submitted) {
      setName('');
      setEmail('');
      setRating(null);
      setComment('');
      setFormStartedAt(Date.now());
    }
  };

  const markFormStarted = () => {
    if (formStartedAt === 0) {
      setFormStartedAt(Date.now());
    }
  };

  return (
    <Card className="p-8">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">Recenzii</h2>
          <p className="mt-1 text-sm text-slate-500">Recenziile sunt publicate dupa aprobare.</p>
        </div>
        <div className="flex items-center gap-2 text-sm text-slate-600">
          <Stars rating={Math.round(averageRating)} />
          <span className="font-medium text-slate-800">{averageRating.toFixed(1)}</span>
          <span>({reviewsCount} recenzii)</span>
        </div>
      </div>

      <form onFocus={markFormStarted} onSubmit={handleSubmit} className="grid gap-3 rounded-2xl bg-slate-50 p-4 sm:grid-cols-2">
        <input
          value={name}
          onChange={(event) => {
            setName(event.target.value);
            clearReviewFeedback();
          }}
          placeholder="Nume"
          className="rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm text-slate-900 outline-none focus:border-slate-400"
        />
        <input
          type="email"
          value={email}
          onChange={(event) => {
            setEmail(event.target.value);
            clearReviewFeedback();
          }}
          placeholder="Email"
          className="rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm text-slate-900 outline-none focus:border-slate-400"
        />
        <div
          className="flex items-center gap-1 px-1 py-2 sm:col-span-2"
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
                  setFormError('');
                  clearReviewFeedback();
                }}
                onMouseEnter={() => setHoverRating(star)}
                className={`cursor-pointer rounded-full p-1 transition ${
                  active ? 'scale-110 text-amber-500' : 'text-slate-300 hover:scale-105 hover:text-amber-400'
                }`}
              >
                <StarIcon filled={active} />
              </button>
            );
          })}
        </div>
        <textarea
          value={comment}
          onChange={(event) => {
            setComment(event.target.value);
            clearReviewFeedback();
          }}
          placeholder="Scrie recenzia ta..."
          rows={3}
          className="rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm text-slate-900 outline-none focus:border-slate-400 sm:col-span-2"
        />
        <input type="text" name="website" tabIndex={-1} autoComplete="off" className="hidden" aria-hidden="true" />
        <div className="sm:col-span-2">
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Se trimite...' : 'Adauga recenzie'}
          </Button>
        </div>
        {formError || error ? (
          <p className="text-sm font-medium text-rose-600 sm:col-span-2">{formError || error}</p>
        ) : null}
        {message ? (
          <p className="text-sm font-medium text-emerald-700 sm:col-span-2">{message}</p>
        ) : null}
      </form>

      <div className="mt-6 space-y-3">
        {isLoading ? (
          <p className="rounded-2xl border border-slate-200 p-4 text-sm text-slate-500">Se incarca recenziile...</p>
        ) : null}
        {!isLoading && reviews.length === 0 ? (
          <p className="rounded-2xl border border-slate-200 p-4 text-sm text-slate-500">
            Nu exista inca recenzii aprobate pentru acest produs.
          </p>
        ) : null}
        {reviews.map((review) => (
          <div key={review.id} className="rounded-2xl border border-slate-200 p-4">
            <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
              <div>
                <p className="font-semibold text-slate-900">{review.name}</p>
                {review.isVerifiedPurchase ? (
                  <p className="mt-1 text-xs font-semibold text-emerald-700">Achizitie verificata</p>
                ) : null}
              </div>
              <Stars rating={review.rating} />
            </div>
            <p className="text-sm leading-6 text-slate-700">{review.comment}</p>
          </div>
        ))}
      </div>
    </Card>
  );
}
