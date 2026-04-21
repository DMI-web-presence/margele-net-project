'use client';

import { createContext, ReactNode, useContext, useEffect, useMemo, useState } from 'react';

export type ProductReview = {
  id: number;
  name: string;
  rating: number;
  comment: string;
};

type ProductReviewsContextValue = {
  reviews: ProductReview[];
  reviewsCount: number;
  averageRating: number;
  addReview: (review: Omit<ProductReview, 'id'>) => void;
};

const ProductReviewsContext = createContext<ProductReviewsContextValue | null>(null);

const defaultReviews: ProductReview[] = [
  { id: 1, name: 'Ana', rating: 5, comment: 'Foarte frumos lucrat, recomand.' },
  { id: 2, name: 'Mihai', rating: 4, comment: 'Calitate buna si livrare rapida.' },
];

export function ProductReviewsProvider({
  productId,
  children,
}: {
  productId: number;
  children: ReactNode;
}) {
  const storageKey = `margele_product_reviews_${productId}`;
  const [reviews, setReviews] = useState<ProductReview[]>(defaultReviews);
  const [hasLoaded, setHasLoaded] = useState(false);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(storageKey);
      if (raw) {
        const parsed = JSON.parse(raw) as ProductReview[];
        if (Array.isArray(parsed) && parsed.length > 0) {
          setReviews(parsed);
        }
      }
    } catch {
      // Ignore malformed local storage and keep defaults.
    } finally {
      setHasLoaded(true);
    }
  }, [storageKey]);

  useEffect(() => {
    if (!hasLoaded) return;
    window.localStorage.setItem(storageKey, JSON.stringify(reviews));
  }, [hasLoaded, reviews, storageKey]);

  const averageRating = useMemo(() => {
    if (reviews.length === 0) return 0;
    const total = reviews.reduce((sum, review) => sum + review.rating, 0);
    return total / reviews.length;
  }, [reviews]);

  const value = useMemo<ProductReviewsContextValue>(
    () => ({
      reviews,
      reviewsCount: reviews.length,
      averageRating,
      addReview: (review) => {
        setReviews((current) => [{ ...review, id: Date.now() }, ...current]);
      },
    }),
    [reviews, averageRating],
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
