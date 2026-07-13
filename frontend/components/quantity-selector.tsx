'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';

type QuantitySelectorProps = {
  min?: number;
  initialValue?: number;
  value?: number;
  onChange?: (quantity: number) => void;
};

export default function QuantitySelector({
  min = 1,
  initialValue = 1,
  value,
  onChange,
}: QuantitySelectorProps) {
  const safeInitial = Math.max(min, initialValue);
  const [internalQuantity, setInternalQuantity] = useState(safeInitial);
  const quantity = value ?? internalQuantity;

  const setQuantity = (nextQuantity: number) => {
    const normalizedQuantity = Math.max(min, nextQuantity);
    if (onChange) {
      onChange(normalizedQuantity);
      return;
    }

    setInternalQuantity(normalizedQuantity);
  };

  const decrement = () => setQuantity(quantity - 1);
  const increment = () => setQuantity(quantity + 1);

  return (
    <div className="space-y-2">
      <p className="text-sm font-semibold text-slate-900">Cantitate</p>
      <div className="flex items-center gap-2">
        <Button
          type="button"
          variant="secondary"
          onClick={decrement}
          aria-label="Scade cantitatea"
          className="h-9 w-9 rounded-xl px-0"
        >
          -
        </Button>
        <span className="inline-flex h-9 min-w-12 items-center justify-center rounded-xl border border-slate-200 px-3 text-sm font-semibold text-slate-900">
          {quantity}
        </span>
        <Button
          type="button"
          variant="secondary"
          onClick={increment}
          aria-label="Creste cantitatea"
          className="h-9 w-9 rounded-xl px-0"
        >
          +
        </Button>
      </div>
    </div>
  );
}
