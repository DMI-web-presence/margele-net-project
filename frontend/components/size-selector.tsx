'use client';

import Image from 'next/image';
import { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';

type SizeOption = {
  value: string;
  imageUrl?: string | null;
  swatchColor?: string | null;
};

type SizeSelectorProps = {
  sizes: SizeOption[];
  label?: string;
  helperText?: string;
  required?: boolean;
  showRequiredHint?: boolean;
  disabled?: boolean;
  disabledValues?: string[];
  allowDeselect?: boolean;
  valueHints?: Record<string, string>;
  value?: string | null;
  onChange?: (size: string | null) => void;
};

export default function SizeSelector({
  sizes,
  label = 'Marime',
  helperText,
  required = false,
  showRequiredHint = false,
  disabled = false,
  disabledValues = [],
  allowDeselect = true,
  valueHints = {},
  value,
  onChange,
}: SizeSelectorProps) {
  const [internalSelectedSize, setInternalSelectedSize] = useState<string | null>(null);
  const [canCollapse, setCanCollapse] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [collapsedMaxHeight, setCollapsedMaxHeight] = useState<number | null>(null);
  const optionsListRef = useRef<HTMLDivElement | null>(null);
  const selectedSize = value !== undefined ? value : internalSelectedSize;

  useEffect(() => {
    const optionsList = optionsListRef.current;
    if (!optionsList) {
      setCanCollapse(false);
      setIsExpanded(false);
      setCollapsedMaxHeight(null);
      return;
    }

    const measureWrap = () => {
      const items = Array.from(optionsList.children) as HTMLElement[];
      const firstItem = items[0];
      if (!firstItem) {
        setCanCollapse(false);
        setIsExpanded(false);
        setCollapsedMaxHeight(null);
        return;
      }

      const firstRowTop = firstItem.offsetTop;
      const wrapsToAnotherRow = items.some((item) => item.offsetTop > firstRowTop + 1);
      const firstRowItems = items.filter((item) => Math.abs(item.offsetTop - firstRowTop) <= 1);
      const firstRowHeight = Math.max(...firstRowItems.map((item) => item.offsetHeight));
      setCanCollapse(wrapsToAnotherRow);
      setCollapsedMaxHeight(firstRowHeight);

      if (!wrapsToAnotherRow) {
        setIsExpanded(false);
        return;
      }

      const selectedItem = items.find((item) => item.dataset.optionValue === selectedSize);
      if (selectedItem && selectedItem.offsetTop > firstRowTop + 1) {
        setIsExpanded(true);
      }
    };

    measureWrap();

    const resizeObserver = new ResizeObserver(measureWrap);
    resizeObserver.observe(optionsList);
    window.addEventListener('resize', measureWrap);

    return () => {
      resizeObserver.disconnect();
      window.removeEventListener('resize', measureWrap);
    };
  }, [selectedSize, sizes.length]);

  const toggleSize = (size: string) => {
    if (disabled || disabledValues.includes(size)) return;

    const nextSize = selectedSize === size && allowDeselect ? null : size;
    if (onChange) {
      onChange(nextSize);
      return;
    }

    setInternalSelectedSize(nextSize);
  };

  return (
    <div
      className={`space-y-2 rounded-2xl transition ${
        showRequiredHint ? 'bg-amber-50/60 p-3 ring-1 ring-amber-200' : ''
      }`}
    >
      <div className="space-y-1">
        <p className="text-sm font-semibold text-slate-900">
          {label}
          {required ? <span className="ml-1 text-amber-600">*</span> : null}
        </p>
        {helperText ? (
          <p className={`text-xs font-medium ${showRequiredHint ? 'text-amber-700' : 'text-slate-500'}`}>
            {helperText}
          </p>
        ) : null}
      </div>
      <div
        ref={optionsListRef}
        className={`flex flex-wrap gap-2 px-1 py-1 transition-[max-height] duration-200 ${
          canCollapse && !isExpanded ? 'overflow-hidden' : ''
        }`}
        style={
          canCollapse && !isExpanded && collapsedMaxHeight
            ? { maxHeight: `${collapsedMaxHeight}px` }
            : undefined
        }
      >
        {sizes.map((size) => {
          const isSelected = selectedSize === size.value;
          const isDisabled = disabled || disabledValues.includes(size.value);
          const isImageOption = Boolean(size.imageUrl);
          const isUnavailableValue = !disabled && disabledValues.includes(size.value);
          const valueHint = valueHints[size.value];

          return (
            <div
              key={size.value}
              data-option-value={size.value}
              className={isImageOption || valueHint ? 'flex flex-col items-center gap-1 mt-0.5' : undefined}
            >
              <span className={isImageOption ? 'rounded-[14px] p-[3px]' : undefined}>
                <Button
                  type="button"
                  variant={isSelected ? 'primary' : 'secondary'}
                  aria-pressed={isSelected}
                  disabled={isDisabled}
                  title={isUnavailableValue ? 'Indisponibil pentru culoarea selectata' : size.value}
                  onClick={() => toggleSize(size.value)}
                  className={`relative h-9 min-w-12 rounded-xl px-3 ${
                    isImageOption ? '!h-14 !w-16 !min-w-16 overflow-hidden !p-0' : ''
                  } ${
                    !isImageOption && size.swatchColor ? 'w-10 overflow-hidden p-1' : ''
                  } ${
                    isDisabled ? 'cursor-not-allowed disabled:cursor-not-allowed opacity-45 hover:bg-slate-100' : ''
                  } ${
                    isImageOption && isSelected
                      ? 'ring-2 ring-indigo-600 ring-offset-2 ring-offset-white shadow-md shadow-indigo-100'
                      : ''
                  } ${
                    isUnavailableValue
                      ? 'overflow-hidden text-slate-400 after:absolute after:left-2 after:right-2 after:top-1/2 after:h-px after:-rotate-12 after:bg-slate-500 after:content-[""]'
                      : ''
                  }`}
                >
                  {size.imageUrl ? (
                    <span className="relative block h-full w-full overflow-hidden rounded-[inherit]">
                      <Image
                        src={size.imageUrl}
                        alt={size.value}
                        fill
                        className="object-cover"
                        unoptimized
                      />
                    </span>
                  ) : size.swatchColor ? (
                    <span
                      className="block h-7 w-7 rounded-full border border-slate-300"
                      style={{ backgroundColor: size.swatchColor }}
                    />
                  ) : (
                    size.value
                  )}
                </Button>
              </span>
              {isImageOption ? (
                <span className="flex w-full flex-col items-center text-center text-[11px] font-semibold leading-tight text-slate-600">
                  {size.value.split(/\s+/).map((word) => (
                    <span key={`${size.value}-${word}`}>{word}</span>
                  ))}
                </span>
              ) : null}
              {!isImageOption && valueHint ? (
                <span
                  className={`text-[11px] font-semibold leading-tight ${
                    isUnavailableValue ? 'text-slate-400' : isSelected ? 'text-indigo-700' : 'text-slate-500'
                  }`}
                >
                  {valueHint}
                </span>
              ) : null}
            </div>
          );
        })}
      </div>
      {canCollapse ? (
        <button
          type="button"
          onClick={() => setIsExpanded((current) => !current)}
          className="text-xs font-semibold text-indigo-700 hover:text-indigo-900"
        >
          {isExpanded ? 'Arata mai putine' : `Vezi toate optiunile (${sizes.length})`}
        </button>
      ) : null}
    </div>
  );
}
