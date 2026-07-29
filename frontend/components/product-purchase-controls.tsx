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
  id?: number;
  optionName: string;
  optionValue: string;
  optionValues?: Record<string, string> | null;
  legacyOptionValueId?: number | null;
  combinationId?: string | null;
  model?: string | null;
  sku?: string | null;
  variantPrice?: number | string | null;
  priceDelta?: number | string | null;
  pricePrefix?: string | null;
  quantity?: number;
  imageUrl?: string | null;
  isActive?: boolean;
};

const priceFormatter = new Intl.NumberFormat('ro-RO', {
  style: 'currency',
  currency: 'RON',
  currencyDisplay: 'narrowSymbol',
});

const applyPriceDelta = (basePrice: number, variant?: ProductVariant) => {
  const safeBasePrice = Number.isFinite(basePrice) ? basePrice : 0;
  if (!variant) return safeBasePrice;

  const variantPrice = Number(variant.variantPrice);
  if (variant.variantPrice !== null && variant.variantPrice !== undefined && Number.isFinite(variantPrice)) {
    return Math.max(0, variantPrice);
  }

  const priceDelta = Number(variant.priceDelta ?? 0);
  if (!Number.isFinite(priceDelta)) return safeBasePrice;

  if ((variant.combinationId || variant.sku || variant.model) && priceDelta > 0) {
    return priceDelta;
  }

  if (variant.pricePrefix === '-') {
    return Math.max(0, safeBasePrice - priceDelta);
  }

  return safeBasePrice + priceDelta;
};

const variantHasPrice = (variant: ProductVariant) => Number.isFinite(Number(variant.priceDelta));

const variantIsAvailable = (variant: ProductVariant) =>
  variant.isActive !== false &&
  (variant.quantity === undefined || variant.quantity === null || variant.quantity > 0);

const variantHasFinalPrice = (variant: ProductVariant) =>
  Boolean(variant.combinationId || variant.sku || variant.model) && Number(variant.priceDelta ?? 0) > 0;

const legacyVariantGroupKey = (variant: ProductVariant) =>
  `${variant.optionName || ''}|${variant.optionValue || ''}|${variant.legacyOptionValueId ?? ''}`.toLowerCase();

const variantPriceSignal = (variant: ProductVariant) => {
  const variantPrice = Number(variant.variantPrice);
  if (variant.variantPrice !== null && variant.variantPrice !== undefined && Number.isFinite(variantPrice) && variantPrice > 0) {
    return variantPrice;
  }

  const priceDelta = Number(variant.priceDelta ?? 0);
  return Number.isFinite(priceDelta) ? priceDelta : 0;
};

const representativeLegacyVariants = (variants: ProductVariant[]) => {
  const grouped = new Map<string, ProductVariant[]>();
  for (const variant of variants) {
    const key = legacyVariantGroupKey(variant);
    grouped.set(key, [...(grouped.get(key) || []), variant]);
  }

  return Array.from(grouped.values()).map((group) => {
    const positiveSignals = group
      .map((variant) => variantPriceSignal(variant))
      .filter((signal) => signal > 0);

    if (positiveSignals.length === 0) {
      return group.find(variantIsAvailable) || group[0];
    }

    const counts = new Map<number, number>();
    for (const signal of positiveSignals) {
      counts.set(signal, (counts.get(signal) || 0) + 1);
    }

    const representativeSignal = Array.from(counts.entries()).sort(
      ([leftSignal, leftCount], [rightSignal, rightCount]) =>
        rightCount - leftCount || leftSignal - rightSignal,
    )[0][0];

    return (
      group.find((variant) => variantIsAvailable(variant) && variantPriceSignal(variant) === representativeSignal) ||
      group.find((variant) => variantPriceSignal(variant) === representativeSignal) ||
      group.find(variantIsAvailable) ||
      group[0]
    );
  });
};

const variantCombinationLegacyIds = (variant: ProductVariant) =>
  String(variant.combinationId || '')
    .split('-')
    .map((part) => Number(part))
    .filter((value) => Number.isFinite(value) && value > 0);

const variantMatchesVisibleColor = (variant: ProductVariant, visibleColorValueIds: Set<number>) => {
  if (visibleColorValueIds.size === 0) return true;

  const combinationIds = variantCombinationLegacyIds(variant);
  if (combinationIds.length > 0) {
    return combinationIds.some((id) => visibleColorValueIds.has(id));
  }

  if (isColorOptionLabel(variant.optionName || '')) {
    return Boolean(variant.legacyOptionValueId && visibleColorValueIds.has(variant.legacyOptionValueId));
  }

  return true;
};

const getBuyablePricedVariants = (
  variants: ProductVariant[],
  visibleColorValueIds: Set<number> = new Set(),
) => {
  const hasCombinationPrices = variants.some((variant) => variant.combinationId || Object.keys(normalizeVariantOptionValues(variant)).length > 0);
  const visibleVariants = variants.filter((variant) => variantMatchesVisibleColor(variant, visibleColorValueIds));
  const pricedVariants = hasCombinationPrices
    ? visibleVariants.filter(variantHasPrice)
    : representativeLegacyVariants(visibleVariants.filter(variantHasPrice));
  const availablePricedVariants = pricedVariants.filter(variantIsAvailable);
  const candidateVariants = availablePricedVariants.length > 0 ? availablePricedVariants : pricedVariants;
  const finalPricedVariants = candidateVariants.filter(variantHasFinalPrice);

  return finalPricedVariants.length > 0 ? finalPricedVariants : candidateVariants;
};

const getLowestVariantPrice = (
  basePrice: number,
  variants: ProductVariant[],
  visibleColorValueIds: Set<number> = new Set(),
) => {
  const safeBasePrice = Number.isFinite(basePrice) ? basePrice : 0;
  const prices = getBuyablePricedVariants(variants, visibleColorValueIds)
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
  const representativeMatch = representativeLegacyVariants(matches)[0];

  return (
    matches.find((variant) => variantHasCode(variant) && variantIsAvailable(variant)) ||
    matches.find(variantHasCode) ||
    representativeMatch ||
    matches.find(variantIsAvailable) ||
    matches[0]
  );
};

const normalizeVariantOptionValues = (variant: ProductVariant): Record<string, string> => {
  const optionValues = variant.optionValues;
  if (!optionValues || typeof optionValues !== 'object' || Array.isArray(optionValues)) {
    return {};
  }

  return Object.fromEntries(
    Object.entries(optionValues)
      .map(([name, value]) => [name.trim(), String(value || '').trim()] as const)
      .filter(([name, value]) => name && value),
  );
};

const normalizedOptionText = (value: string) => value.trim().toLowerCase();

const variantLegacyOptionValueIds = (variant: ProductVariant) =>
  new Set(
    [
      variant.legacyOptionValueId,
      ...variantCombinationLegacyIds(variant),
    ].filter((value): value is number => typeof value === 'number' && Number.isFinite(value) && value > 0),
  );

const selectedPurchaseOptions = (
  groups: PurchaseOptionGroup[],
  selections: Record<string, string | null>,
) =>
  groups.flatMap((group) => {
    const selectedValue = selections[group.name];
    if (!selectedValue) return [];

    const option = group.options.find(
      (candidate) => normalizedOptionText(candidate.value) === normalizedOptionText(selectedValue),
    );

    return [
      {
        name: group.name,
        value: selectedValue,
        legacyOptionValueId: option?.legacyOptionValueId ?? null,
      },
    ];
  });

const variantMatchesSelections = (
  variant: ProductVariant,
  selections: Record<string, string | null>,
  groups: PurchaseOptionGroup[],
) => {
  const selectedEntries = selectedPurchaseOptions(groups, selections);
  if (selectedEntries.length === 0) return true;

  const optionValues = normalizeVariantOptionValues(variant);
  if (Object.keys(optionValues).length > 0) {
    return selectedEntries.every(({ name: selectedName, value: selectedValue }) =>
      Object.entries(optionValues).some(
        ([optionName, optionValue]) =>
          normalizedOptionText(optionName) === normalizedOptionText(selectedName) &&
          normalizedOptionText(optionValue) === normalizedOptionText(selectedValue),
      ),
    );
  }

  const legacyIds = variantLegacyOptionValueIds(variant);
  const selectedLegacyIds = selectedEntries
    .map((entry) => entry.legacyOptionValueId)
    .filter((value): value is number => typeof value === 'number' && Number.isFinite(value));

  if (selectedLegacyIds.length === selectedEntries.length) {
    return selectedLegacyIds.every((legacyId) => legacyIds.has(legacyId));
  }

  return selectedEntries.every(
    ({ name, value, legacyOptionValueId }) =>
      (legacyOptionValueId ? legacyIds.has(legacyOptionValueId) : false) ||
      (
        normalizedOptionText(variant.optionName || '') === normalizedOptionText(name) &&
        normalizedOptionText(variant.optionValue || '') === normalizedOptionText(value)
      ),
  );
};

const selectionVariantsForGroups = (
  variants: ProductVariant[],
  groups: PurchaseOptionGroup[],
) => {
  const combinationVariants = variants.filter(
    (variant) => Object.keys(normalizeVariantOptionValues(variant)).length > 0,
  );
  if (combinationVariants.length > 0) return combinationVariants;

  const groupsWithLegacyIds = groups.filter((group) =>
    group.options.some((option) => typeof option.legacyOptionValueId === 'number'),
  ).length;
  const legacyCombinationVariants = variants.filter((variant) => {
    if (groupsWithLegacyIds <= 1) {
      return variantLegacyOptionValueIds(variant).size >= 1;
    }

    return (
      Boolean(variant.combinationId || variant.sku || variant.model) &&
      variantLegacyOptionValueIds(variant).size >= groupsWithLegacyIds
    );
  });

  return legacyCombinationVariants.length > 0 ? legacyCombinationVariants : variants;
};

const resolveSelectedVariant = (
  variants: ProductVariant[],
  selections: Record<string, string | null>,
  groups: PurchaseOptionGroup[],
) =>
  findBestVariant(
    variants,
    (variant) => variantMatchesSelections(variant, selections, groups),
  );

const isColorOptionLabel = (value: string) => {
  const normalized = value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();

  return normalized.includes('culoare') || normalized.includes('color') || normalized.includes('nuanta');
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
  const rawGroups =
    optionGroups && optionGroups.length > 0 ? optionGroups : [{ name: optionName, options }];
  const groups = rawGroups
    .map((group) => ({
      ...group,
      options: isColorOptionLabel(group.name)
        ? group.options.filter((option) => Boolean(option.imageUrl))
        : group.options,
    }))
    .filter((group) => group.options.length > 0);
  const imageOptionGroupNames = groups
    .filter((group) => group.options.some((option) => option.imageUrl))
    .map((group) => group.name);
  const visibleColorValueIds = new Set(
    groups
      .filter((group) => isColorOptionLabel(group.name))
      .flatMap((group) => group.options)
      .map((option) => option.legacyOptionValueId)
      .filter((id): id is number => typeof id === 'number' && Number.isFinite(id)),
  );
  const hasImageOptionGroups = imageOptionGroupNames.length > 0;
  const [selectedOptions, setSelectedOptions] = useState<Record<string, string | null>>(() =>
    Object.fromEntries(
      groups.map((group) => {
        const selectedValue =
          group.options.length === 1
            ? group.options[0]?.value ?? null
            : null;

        return [group.name, selectedValue];
      }),
    ),
  );
  const [showSelectionNotice, setShowSelectionNotice] = useState(false);
  const hasSelectedImageOption = imageOptionGroupNames.some((name) => Boolean(selectedOptions[name]));
  const selectedImageOption = groups
    .filter((group) => isColorOptionLabel(group.name))
    .concat(groups.filter((group) => !isColorOptionLabel(group.name) && imageOptionGroupNames.includes(group.name)))
    .flatMap((group) => group.options.filter((option) => option.value === selectedOptions[group.name]))
    .find((option) => option.imageUrl);
  const hasCompleteSelection = groups
    .filter((group) => group.options.length > 0)
    .every((group) => Boolean(selectedOptions[group.name]));
  const selectionVariants = selectionVariantsForGroups(variants, groups);
  const availableSelectionVariants = selectionVariants.filter(variantIsAvailable);
  const selectedVariant = hasCompleteSelection
    ? resolveSelectedVariant(availableSelectionVariants, selectedOptions, groups)
    : undefined;
  const basePrice = Number(product.price);
  const compatibleVariants = availableSelectionVariants.filter((variant) =>
    variantMatchesSelections(variant, selectedOptions, groups),
  );
  const lowestVariantPrice = getLowestVariantPrice(
    basePrice,
    compatibleVariants.length > 0 ? compatibleVariants : selectionVariants,
    visibleColorValueIds,
  );
  const missingRequiredGroups = groups
    .filter((group) => group.options.length > 0)
    .filter((group) => !selectedOptions[group.name])
    .map((group) => group.name);
  const hasMissingRequiredGroups = missingRequiredGroups.length > 0;
  const hasUnavailableCombination =
    selectionVariants.length > 0 && hasCompleteSelection && !selectedVariant;
  const selectionNoticeText =
    missingRequiredGroups.length > 0
      ? `Alege ${missingRequiredGroups.map((name) => name.toLowerCase()).join(' si ')} pentru a adauga produsul in cos.`
      : hasUnavailableCombination
        ? 'Combinatia selectata nu este disponibila momentan.'
      : '';
  const hasVariablePrice =
    new Set(getBuyablePricedVariants(variants, visibleColorValueIds).map((variant) => applyPriceDelta(basePrice, variant).toFixed(2))).size >
    1;
  const shouldShowFromPrice = hasVariablePrice && (!hasCompleteSelection || hasUnavailableCombination);
  const currentPrice = shouldShowFromPrice ? lowestVariantPrice : applyPriceDelta(basePrice, selectedVariant);
  const currentPriceText = `${shouldShowFromPrice ? 'De la ' : ''}${priceFormatter.format(currentPrice)}`;
  const currentSku = selectedVariant?.sku || product.sku || null;
  const currentVariantId = selectedVariant?.id ?? null;
  const [quantity, setQuantity] = useState(1);
  const cartOption = Object.entries(selectedOptions)
    .filter(([, value]) => Boolean(value))
    .map(([name, value]) => `${name}: ${value}`)
    .join('; ');
  const optionSelectors = groups.map((group, groupIndex) => {
    if (group.options.length === 0) return null;

    const isImageOptionGroup = group.options.some((option) => option.imageUrl);
    const shouldWaitForImageOption = !isImageOptionGroup && hasImageOptionGroups && !hasSelectedImageOption;
    const isMissingRequiredGroup = showSelectionNotice && missingRequiredGroups.includes(group.name);
    const priorSelections = Object.fromEntries(
      groups
        .slice(0, groupIndex)
        .map((priorGroup) => [priorGroup.name, selectedOptions[priorGroup.name] ?? null]),
    );
    const hasCompletePriorSelection = groups
      .slice(0, groupIndex)
      .every((priorGroup) => Boolean(selectedOptions[priorGroup.name]));
    const disabledValues = group.options
      .filter((option) => {
        const candidateSelections = {
          ...priorSelections,
          [group.name]: option.value,
        };
        return !availableSelectionVariants.some((variant) =>
          variantMatchesSelections(variant, candidateSelections, groups),
        );
      })
      .map((option) => option.value);
    const valueHints = Object.fromEntries(
      group.options.flatMap((option) => {
        const candidateSelections = {
          ...priorSelections,
          [group.name]: option.value,
        };
        const matchingVariant = resolveSelectedVariant(
          availableSelectionVariants,
          candidateSelections,
          groups,
        );

        return matchingVariant
          ? [[option.value, priceFormatter.format(applyPriceDelta(basePrice, matchingVariant))]]
          : [];
      }),
    );

    return (
      <SizeSelector
        key={group.name}
        sizes={group.options}
        label={group.name}
        helperText={
          isMissingRequiredGroup
            ? `Selecteaza ${group.name.toLowerCase()}.`
            : shouldWaitForImageOption
            ? 'Selecteaza o culoare pentru a vedea dimensiunile disponibile.'
            : undefined
        }
        required={groups.length > 1 || hasVariablePrice}
        showRequiredHint={isMissingRequiredGroup}
        disabled={shouldWaitForImageOption}
        allowDeselect={!isImageOptionGroup}
        valueHints={groupIndex > 0 && hasCompletePriorSelection ? valueHints : {}}
        disabledValues={disabledValues}
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

            for (const dependentGroup of groups.slice(groupIndex + 1)) {
              const currentValue = current[dependentGroup.name];
              if (!currentValue) {
                nextOptions[dependentGroup.name] = null;
                continue;
              }

              const candidateSelections = Object.fromEntries(
                groups
                  .slice(0, groups.indexOf(dependentGroup) + 1)
                  .map((candidateGroup) => [
                    candidateGroup.name,
                    candidateGroup.name === dependentGroup.name
                      ? currentValue
                      : nextOptions[candidateGroup.name] ?? null,
                  ]),
              );
              const remainsAvailable = availableSelectionVariants.some((variant) =>
                variantMatchesSelections(variant, candidateSelections, groups),
              );

              nextOptions[dependentGroup.name] = remainsAvailable ? currentValue : null;
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
          variant={hasMissingRequiredGroups || hasUnavailableCombination ? 'secondary' : 'primary'}
          className={
            hasMissingRequiredGroups || hasUnavailableCombination
              ? 'border-amber-200 bg-amber-50 text-amber-800 hover:bg-amber-100'
              : ''
          }
          onClick={(event) => {
            if (hasMissingRequiredGroups || hasUnavailableCombination) {
              setShowSelectionNotice(true);
              return;
            }

            addToCart(
              {
                ...product,
                imageUrl: selectedVariant?.imageUrl ?? selectedImageOption?.imageUrl ?? product.imageUrl,
                price: currentPrice.toFixed(2),
                sku: currentSku,
                variantId: currentVariantId,
                selectedSize: cartOption || null,
              },
              event.currentTarget,
              quantity,
            );
          }}
        >
          {hasMissingRequiredGroups
            ? 'Selecteaza optiunile'
            : hasUnavailableCombination
              ? 'Combinatie indisponibila'
              : 'Adauga in cos'}
        </Button>
        <ProductFavoriteIconButton product={product} />
      </div>
      {showSelectionNotice && selectionNoticeText ? (
        <p className="max-w-md text-xs font-semibold text-amber-700">{selectionNoticeText}</p>
      ) : null}
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
