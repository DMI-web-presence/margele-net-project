'use client';

import { useState } from 'react';
import ProductFavoriteIconButton from '@/components/product-favorite-icon-button';
import QuantitySelector from '@/components/quantity-selector';
import SizeSelector from '@/components/size-selector';
import { useCart } from '@/components/cart-provider';
import { Button } from '@/components/ui/button';

type ProductPurchaseControlsProps = {
  product: {
    id: number;
    name: string;
    price: string;
    imageUrl: string | null;
  };
  sizes: string[];
};

export default function ProductPurchaseControls({
  product,
  sizes,
}: ProductPurchaseControlsProps) {
  const { addToCart } = useCart();
  const [selectedSize, setSelectedSize] = useState<string | null>(sizes[0] ?? null);
  const [quantity, setQuantity] = useState(1);

  return (
    <div className="space-y-5">
      <SizeSelector sizes={sizes} value={selectedSize} onChange={setSelectedSize} />
      <QuantitySelector value={quantity} onChange={setQuantity} />

      <div className="flex items-center gap-2">
        <Button
          type="button"
          onClick={(event) =>
            addToCart(
              {
                ...product,
                selectedSize,
              },
              event.currentTarget,
              quantity,
            )
          }
        >
          Adauga in cos
        </Button>
        <ProductFavoriteIconButton product={product} />
      </div>
    </div>
  );
}
