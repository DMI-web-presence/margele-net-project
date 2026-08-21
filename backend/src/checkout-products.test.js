const test = require('node:test');
const assert = require('node:assert/strict');
const { cartLineRequiresResolvedVariant, findCheckoutProduct } = require('./checkout-products');

function checkoutProducts() {
  return new Map([
    [
      1,
      {
        id: 1,
        sku: 'rotunde-semimate-2mm',
        variants: [{ id: 9406, sku: '12155', model: 'rotunde-verde-50g' }],
      },
    ],
    [2, { id: 2, sku: 'other-product', variants: [] }],
  ]);
}

test('findCheckoutProduct recovers a stale product id through a unique variant SKU', () => {
  const product = findCheckoutProduct(checkoutProducts(), 999999, '12155', 9406);

  assert.equal(product?.id, 1);
});

test('findCheckoutProduct keeps the direct product match when no stable identifier matches', () => {
  const product = findCheckoutProduct(checkoutProducts(), 2, null, null);

  assert.equal(product?.id, 2);
});

test('a simple product SKU does not require a variant', () => {
  const product = { id: 3, sku: 'margele-shamballa', variants: [] };

  assert.equal(
    cartLineRequiresResolvedVariant(product, {
      requestedSku: 'margele-shamballa',
      requestedVariantId: null,
      selectedOptions: null,
      requiresVariantSelection: false,
    }),
    false,
  );
});

test('a variant SKU still requires a matching variant', () => {
  const product = { id: 1, sku: 'rotunde-semimate-2mm', variants: [] };

  assert.equal(
    cartLineRequiresResolvedVariant(product, {
      requestedSku: '12155',
      requestedVariantId: null,
      selectedOptions: null,
      requiresVariantSelection: false,
    }),
    true,
  );
});

test('a product with selectable variants still requires a resolved variant', () => {
  const product = { id: 1, sku: 'rotunde-semimate-2mm', variants: [{ id: 9406, sku: '12155' }] };

  assert.equal(
    cartLineRequiresResolvedVariant(product, {
      requestedSku: 'rotunde-semimate-2mm',
      requestedVariantId: null,
      selectedOptions: null,
      requiresVariantSelection: true,
    }),
    true,
  );
});

test('a product SKU keeps requiring resolution when variant rows exist', () => {
  const product = { id: 1, sku: 'rotunde-semimate-2mm', variants: [{ id: 9406, sku: '12155' }] };

  assert.equal(
    cartLineRequiresResolvedVariant(product, {
      requestedSku: 'rotunde-semimate-2mm',
      requestedVariantId: null,
      selectedOptions: null,
      requiresVariantSelection: false,
    }),
    true,
  );
});
