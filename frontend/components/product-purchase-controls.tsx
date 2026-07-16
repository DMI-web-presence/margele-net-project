'use client';

import type { ReactNode } from 'react';
import { useState } from 'react';
import ProductFavoriteIconButton from '@/components/product-favorite-icon-button';
import QuantitySelector from '@/components/quantity-selector';
import SizeSelector from '@/components/size-selector';
import { useCart } from '@/components/cart-provider';
import { Button } from '@/components/ui/button';

type PurchaseOption = {
  value: string;
  imageUrl?: string | null;
  swatchColor?: string | null;
  legacyOptionValueId?: number | null;
};

type PurchaseOptionGroup = {
  name: string;
  options: PurchaseOption[];
};

type ProductPurchaseControlsProps = {
  product: {
    id: number;
    name: string;
    price: string;
    imageUrl: string | null;
    sku?: string | null;
  };
  productDetails?: {
    material: string;
    tag?: string | null;
    availability: string;
    code: string;
  };
  optionName?: string;
  options: PurchaseOption[];
  optionGroups?: PurchaseOptionGroup[];
  variants?: ProductVariant[];
  children?: ReactNode;
};

type ProductVariant = {
  optionName: string;
  optionValue: string;
  legacyOptionValueId?: number | null;
  combinationId?: string | null;
  model?: string | null;
  sku?: string | null;
  priceDelta?: number | string | null;
  pricePrefix?: string | null;
  quantity?: number;
};

const priceFormatter = new Intl.NumberFormat('ro-RO', {
  style: 'currency',
  currency: 'RON',
  currencyDisplay: 'narrowSymbol',
});

const applyPriceDelta = (basePrice: number, variant?: ProductVariant) => {
  const safeBasePrice = Number.isFinite(basePrice) ? basePrice : 0;
  if (!variant) return safeBasePrice;

  const priceDelta = Number(variant.priceDelta ?? 0);
  if (!Number.isFinite(priceDelta)) return safeBasePrice;

  if (variant.combinationId && priceDelta > 0) {
    return priceDelta;
  }

  if (variant.pricePrefix === '-') {
    return Math.max(0, safeBasePrice - priceDelta);
  }

  return safeBasePrice + priceDelta;
};

const variantHasPrice = (variant: ProductVariant) => Number.isFinite(Number(variant.priceDelta));

const variantIsAvailable = (variant: ProductVariant) =>
  variant.quantity === undefined || variant.quantity === null || variant.quantity > 0;

const variantIsCompleteCombination = (variant: ProductVariant) =>
  Boolean(variant.combinationId) && Number(variant.priceDelta ?? 0) > 0;

const getBuyablePricedVariants = (variants: ProductVariant[]) => {
  const pricedVariants = variants.filter(variantHasPrice);
  const availablePricedVariants = pricedVariants.filter(variantIsAvailable);
  const candidateVariants = availablePricedVariants.length > 0 ? availablePricedVariants : pricedVariants;
  const combinationVariants = candidateVariants.filter(variantIsCompleteCombination);

  return combinationVariants.length > 0 ? combinationVariants : candidateVariants;
};

const getLowestVariantPrice = (basePrice: number, variants: ProductVariant[]) => {
  const safeBasePrice = Number.isFinite(basePrice) ? basePrice : 0;
  const prices = getBuyablePricedVariants(variants)
    .map((variant) => applyPriceDelta(safeBasePrice, variant))
    .filter(Number.isFinite);

  return prices.length > 0 ? Math.min(...prices) : safeBasePrice;
};

const variantHasCode = (variant: ProductVariant) => Boolean(variant.sku || variant.model);

const findBestVariant = (
  variants: ProductVariant[],
  predicate: (variant: ProductVariant) => boolean,
) => {
  const matches = variants.filter(predicate);

  return (
    matches.find((variant) => variantHasCode(variant) && variantIsAvailable(variant)) ||
    matches.find(variantHasCode) ||
    matches.find(variantIsAvailable) ||
    matches[0]
  );
};

export default function ProductPurchaseControls({
  product,
  productDetails,
  optionName = 'Optiune',
  options,
  optionGroups,
  variants = [],
  children,
}: ProductPurchaseControlsProps) {
  const { addToCart } = useCart();
  const groups =
    optionGroups && optionGroups.length > 0 ? optionGroups : [{ name: optionName, options }];
  const imageOptionGroupNames = groups
    .filter((group) => group.options.some((option) => option.imageUrl))
    .map((group) => group.name);
  const hasImageOptionGroups = imageOptionGroupNames.length > 0;
  const [selectedOptions, setSelectedOptions] = useState<Record<string, string | null>>(() =>
    Object.fromEntries(
      groups.map((group) => {
        const selectedValue =
          group.options.length === 1 || !hasImageOptionGroups
            ? group.options[0]?.value ?? null
            : null;

        return [group.name, selectedValue];
      }),
    ),
  );
  const hasSelectedImageOption = imageOptionGroupNames.some((name) => Boolean(selectedOptions[name]));
  const selectedImageOption = groups
    .filter((group) => imageOptionGroupNames.includes(group.name))
    .flatMap((group) => group.options.filter((option) => option.value === selectedOptions[group.name]))
    .find((option) => option.imageUrl);
  const selectedImageValueId = selectedImageOption?.legacyOptionValueId;
  const selectedNonImageOptions = groups
    .filter((group) => !group.options.some((option) => option.imageUrl))
    .map((group) => group.options.find((option) => option.value === selectedOptions[group.name]))
    .filter(Boolean) as PurchaseOption[];
  const selectedVariant =
    selectedNonImageOptions
      .map((option) =>
        findBestVariant(variants, (variant) => {
          if (!option.legacyOptionValueId || variant.legacyOptionValueId !== option.legacyOptionValueId) {
            return false;
          }

          if (!selectedImageValueId) {
            return !variant.combinationId;
          }

          return Boolean(
            variant.combinationId
              ?.split('-')
              .map((part) => Number(part))
              .includes(selectedImageValueId),
          );
        }),
      )
      .find(Boolean) ||
    (selectedImageValueId
      ? findBestVariant(
          variants,
          (variant) =>
            variant.legacyOptionValueId === selectedImageValueId &&
            (!variant.combinationId || variant.combinationId.includes(String(selectedImageValueId))),
        )
      : undefined);
  const basePrice = Number(product.price);
  const lowestVariantPrice = getLowestVariantPrice(basePrice, variants);
  const hasCompleteSelection = groups
    .filter((group) => group.options.length > 0)
    .every((group) => Boolean(selectedOptions[group.name]));
  const hasVariablePrice =
    new Set(getBuyablePricedVariants(variants).map((variant) => applyPriceDelta(basePrice, variant).toFixed(2))).size >
    1;
  const shouldShowFromPrice = hasVariablePrice && !hasCompleteSelection;
  const currentPrice = shouldShowFromPrice ? lowestVariantPrice : applyPriceDelta(basePrice, selectedVariant);
  const currentPriceText = `${shouldShowFromPrice ? 'De la ' : ''}${priceFormatter.format(currentPrice)}`;
  const currentSku = selectedVariant?.sku || selectedVariant?.model || null;
  const [quantity, setQuantity] = useState(1);
  const cartOption = Object.entries(selectedOptions)
    .filter(([, value]) => Boolean(value))
    .map(([name, value]) => `${name}: ${value}`)
    .join('; ');
  const priceHintsByOptionValue =
    selectedImageValueId
      ? variants.reduce<Record<string, string>>((hints, variant) => {
          if (!variant.legacyOptionValueId || !variant.combinationId) return hints;

          const isForSelectedImage = variant.combinationId
            .split('-')
            .map((part) => Number(part))
            .includes(selectedImageValueId);

          if (!isForSelectedImage || !variantIsAvailable(variant)) return hints;

          hints[String(variant.legacyOptionValueId)] = priceFormatter.format(applyPriceDelta(basePrice, variant));
          return hints;
        }, {})
      : {};
  const optionSelectors = groups.map((group) => {
    if (group.options.length === 0) return null;

    const isImageOptionGroup = group.options.some((option) => option.imageUrl);
    const shouldWaitForImageOption = !isImageOptionGroup && hasImageOptionGroups && !hasSelectedImageOption;

    return (
      <SizeSelector
        key={group.name}
        sizes={group.options}
        label={group.name}
        helperText={
          shouldWaitForImageOption
            ? 'Selecteaza o culoare pentru a vedea dimensiunile disponibile.'
            : undefined
        }
        disabled={shouldWaitForImageOption}
        allowDeselect={!isImageOptionGroup}
        valueHints={
          !isImageOptionGroup && selectedImageValueId
            ? Object.fromEntries(
                group.options
                  .filter((option) => option.legacyOptionValueId)
                  .map((option) => [
                    option.value,
                    priceHintsByOptionValue[String(option.legacyOptionValueId)] ?? '',
                  ])
                  .filter(([, hint]) => hint),
              )
            : {}
        }
        disabledValues={
          !isImageOptionGroup && selectedImageValueId
            ? group.options
                .filter((option) => {
                  const optionValueId = option.legacyOptionValueId;
                  if (!optionValueId) return false;

                  return !variants.some(
                    (variant) =>
                      variant.legacyOptionValueId === optionValueId &&
                      variant.combinationId
                        ?.split('-')
                        .map((part) => Number(part))
                        .includes(selectedImageValueId),
                  );
                })
                .map((option) => option.value)
            : []
        }
        value={selectedOptions[group.name] ?? null}
        onChange={(value) => {
          const selectedOption = group.options.find((option) => option.value === value);
          const isImageOptionGroup = group.options.some((option) => option.imageUrl);
          if (isImageOptionGroup) {
            window.dispatchEvent(
              new CustomEvent('product-option-image-change', {
                detail: { src: selectedOption?.imageUrl ?? null },
              }),
            );
          }

          setSelectedOptions((current) => {
            const nextOptions = {
              ...current,
              [group.name]: value,
            };

            if (!isImageOptionGroup) {
              return nextOptions;
            }

            const selectedImageValueId = selectedOption?.legacyOptionValueId;
            for (const dependentGroup of groups.filter(
              (item) => !item.options.some((option) => option.imageUrl),
            )) {
              const currentDependentOption = dependentGroup.options.find(
                (option) => option.value === current[dependentGroup.name],
              );

              const isStillAvailable =
                selectedImageValueId &&
                currentDependentOption?.legacyOptionValueId &&
                variants.some(
                  (variant) =>
                    variant.legacyOptionValueId === currentDependentOption.legacyOptionValueId &&
                    variant.combinationId
                      ?.split('-')
                      .map((part) => Number(part))
                      .includes(selectedImageValueId),
                );

              nextOptions[dependentGroup.name] = isStillAvailable
                ? currentDependentOption.value
                : null;
            }

            return nextOptions;
          });
        }}
      />
    );
  });
  const metadata = productDetails ? (
    <div className="space-y-1 text-sm text-slate-700">
      <p>
        <span className="font-semibold text-slate-900">Material:</span> {productDetails.material}
        {productDetails.tag ? (
          <span className="ml-2 inline-flex items-center rounded-full bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-700">
            {productDetails.tag}
          </span>
        ) : null}
      </p>
      <p>
        <span className="font-semibold text-slate-900">Disponibilitate:</span> {productDetails.availability}
      </p>
      {productDetails.code ? (
        <p>
          <span className="font-semibold text-slate-900">Cod produs:</span> {productDetails.code}
        </p>
      ) : null}
      {currentSku ? (
        <p>
          <span className="font-semibold text-slate-900">SKU:</span> {currentSku}
        </p>
      ) : null}
    </div>
  ) : null;
  const actions = (
    <>
      <QuantitySelector value={quantity} onChange={setQuantity} />

      <div className="flex items-center gap-2">
        <Button
          type="button"
          onClick={(event) =>
            addToCart(
              {
                ...product,
                imageUrl: selectedImageOption?.imageUrl ?? product.imageUrl,
                price: currentPrice.toFixed(2),
                sku: currentSku || product.sku || null,
                selectedSize: cartOption || null,
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
    </>
  );

  return (
    <div className="space-y-5">
      <div className="space-y-2">
        <p className="text-4xl font-extrabold leading-tight text-indigo-700">{currentPriceText}</p>
        {metadata}
        {children}
      </div>

      {optionSelectors}
      {actions}
    </div>
  );
}
