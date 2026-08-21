function findCheckoutProduct(products, requestedProductId, requestedSku, requestedVariantId) {
  const directMatch = products.get(requestedProductId);
  const candidates = Array.from(products.values());
  const sku = String(requestedSku || '').trim();

  if (sku) {
    const skuMatches = candidates.filter(
      (product) =>
        String(product.sku || '').trim() === sku ||
        product.variants.some(
          (variant) =>
            String(variant.sku || '').trim() === sku || String(variant.model || '').trim() === sku,
        ),
    );
    if (skuMatches.length === 1) return skuMatches[0];
  }

  if (requestedVariantId) {
    const variantMatches = candidates.filter((product) =>
      product.variants.some((variant) => Number(variant.id) === requestedVariantId),
    );
    if (variantMatches.length === 1) return variantMatches[0];
  }

  return directMatch || null;
}

function cartLineRequiresResolvedVariant(
  product,
  { requestedSku, requestedVariantId, selectedOptions, requiresVariantSelection },
) {
  const sku = String(requestedSku || '').trim();
  const productSku = String(product?.sku || '').trim();
  const hasVariants = Array.isArray(product?.variants) && product.variants.length > 0;
  const requestsSpecificVariant = Boolean(sku && (sku !== productSku || hasVariants));

  return Boolean(
    requestedVariantId ||
      selectedOptions ||
      requiresVariantSelection ||
      requestsSpecificVariant
  );
}

module.exports = { cartLineRequiresResolvedVariant, findCheckoutProduct };
