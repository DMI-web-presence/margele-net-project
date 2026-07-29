'use client';

import { createContext, ReactNode, useCallback, useContext, useEffect, useMemo, useState } from 'react';

const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL ?? 'http://localhost:3001';

export type ProductReview = {
  id: number;
  productId: number;
  userId: number | null;
  orderId: number | null;
  name: string;
  rating: number;
  comment: string;
  status: string;
  isVerifiedPurchase: boolean;
  createdAt: string | null;
  updatedAt: string | null;
};

type ReviewSubmission = {
  name: string;
  email: string;
  rating: number;
  comment: string;
  formStartedAt: number;
};

type ProductReviewsContextValue = {
  reviews: ProductReview[];
  reviewsCount: number;
  averageRating: number;
  isLoading: boolean;
  isSubmitting: boolean;
  message: string;
  error: string;
  addReview: (review: ReviewSubmission) => Promise<boolean>;
  clearReviewFeedback: () => void;
};

const ProductReviewsContext = createContext<ProductReviewsContextValue | null>(null);

export function ProductReviewsProvider({
  productId,
  children,
}: {
  productId: number;
  children: ReactNode;
}) {
  const [reviews, setReviews] = useState<ProductReview[]>([]);
  const [reviewsCount, setReviewsCount] = useState(0);
  const [averageRating, setAverageRating] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const loadReviews = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`${backendUrl}/products/${productId}/reviews`, {
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('Reviews fetch failed.');
      }

      const data = await response.json();
      setReviews(Array.isArray(data.reviews) ? data.reviews : []);
      setReviewsCount(Number(data.reviewsCount || 0));
      setAverageRating(Number(data.averageRating || 0));
    } catch {
      setError('Nu am putut incarca recenziile momentan.');
    } finally {
      setIsLoading(false);
    }
  }, [productId]);

  useEffect(() => {
    void loadReviews();
  }, [loadReviews]);

  const value = useMemo<ProductReviewsContextValue>(
    () => ({
      reviews,
      reviewsCount,
      averageRating,
      isLoading,
      isSubmitting,
      message,
      error,
      addReview: async (review) => {
        setIsSubmitting(true);
        setMessage('');
        setError('');

        try {
          const response = await fetch(`${backendUrl}/products/${productId}/reviews`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify(review),
          });
          const data = await response.json().catch(() => ({}));

          if (!response.ok) {
            setError(data.message || 'Recenzia nu a putut fi trimisa.');
            return false;
          }

          setMessage(data.message || 'Multumim! Recenzia ta va fi vizibila dupa aprobare.');
          return true;
        } catch {
          setError('Recenzia nu a putut fi trimisa momentan.');
          return false;
        } finally {
          setIsSubmitting(false);
        }
      },
      clearReviewFeedback: () => {
        setMessage('');
        setError('');
      },
    }),
    [averageRating, error, isLoading, isSubmitting, message, productId, reviews, reviewsCount],
  );

  return (
    <ProductReviewsContext.Provider value={value}>
      {children}
    </ProductReviewsContext.Provider>
  );
}

export function useProductReviews() {
  const context = useContext(ProductReviewsContext);
  if (!context) {
    throw new Error('useProductReviews must be used inside ProductReviewsProvider');
  }
  return context;
}
