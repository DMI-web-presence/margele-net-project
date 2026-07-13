'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';

type SizeSelectorProps = {
  sizes: string[];
  value?: string | null;
  onChange?: (size: string | null) => void;
};

export default function SizeSelector({ sizes, value, onChange }: SizeSelectorProps) {
  const [internalSelectedSize, setInternalSelectedSize] = useState<string | null>(null);
  const selectedSize = value !== undefined ? value : internalSelectedSize;

  const toggleSize = (size: string) => {
    const nextSize = selectedSize === size ? null : size;
    if (onChange) {
      onChange(nextSize);
      return;
    }

    setInternalSelectedSize(nextSize);
  };

  return (
    <div className="space-y-2">
      <p className="text-sm font-semibold text-slate-900">Marime</p>
      <div className="flex flex-wrap gap-2">
        {sizes.map((size) => {
          const isSelected = selectedSize === size;
          return (
            <Button
              key={size}
              type="button"
              variant={isSelected ? 'primary' : 'secondary'}
              aria-pressed={isSelected}
              onClick={() => toggleSize(size)}
              className="h-9 min-w-12 rounded-xl px-3"
            >
              {size}
            </Button>
          );
        })}
      </div>
    </div>
  );
}
