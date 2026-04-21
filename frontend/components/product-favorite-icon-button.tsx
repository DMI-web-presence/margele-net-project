'use client';

import { useCart } from '@/components/cart-provider';

type ProductFavoriteIconButtonProps = {
  product: {
    id: number;
    name: string;
    price: string;
    imageUrl: string | null;
  };
};

function FavoriteButtonIcon({ filled = false }: { filled?: boolean }) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      className={`h-5 w-5 stroke-current stroke-2 ${filled ? 'fill-current' : 'fill-none'}`}
    >
      <path d="M12 20s-6.7-4.2-8.7-8.1A5.1 5.1 0 0 1 12 6a5.1 5.1 0 0 1 8.7 5.9C18.7 15.8 12 20 12 20Z" />
    </svg>
  );
}

export default function ProductFavoriteIconButton({ product }: ProductFavoriteIconButtonProps) {
  const { isFavorite, toggleFavorite } = useCart();
  const favorited = isFavorite(product.id);

  return (
    <button
      type="button"
      aria-label={favorited ? `Elimina ${product.name} din favorite` : `Adauga ${product.name} la favorite`}
      onClick={(event) => toggleFavorite(product, event.currentTarget)}
      className={`inline-flex h-10 w-10 cursor-pointer items-center justify-center rounded-2xl border border-slate-200 bg-white transition hover:scale-110 ${
        favorited ? 'text-rose-600' : 'text-rose-500'
      }`}
    >
      <FavoriteButtonIcon filled={favorited} />
    </button>
  );
}
