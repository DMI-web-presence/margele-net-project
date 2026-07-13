'use client';

import { useCart } from '@/components/cart-provider';
import { Button } from '@/components/ui/button';

type ProductAddToCartButtonProps = {
  product: {
    id: number;
    name: string;
    price: string;
    imageUrl: string | null;
  };
};

export default function ProductAddToCartButton({ product }: ProductAddToCartButtonProps) {
  const { addToCart } = useCart();

  return (
    <Button
      type="button"
      onClick={(event) => addToCart(product, event.currentTarget)}
    >
      Adauga in cos
    </Button>
  );
}
