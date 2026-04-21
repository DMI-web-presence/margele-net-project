'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';

type SizeSelectorProps = {
  sizes: string[];
};

export default function SizeSelector({ sizes }: SizeSelectorProps) {
  const [selectedSize, setSelectedSize] = useState<string | null>(null);

  const toggleSize = (size: string) => {
    setSelectedSize((current) => (current === size ? null : size));
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
