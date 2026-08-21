const test = require('node:test');
const assert = require('node:assert/strict');
const { findCheckoutProduct } = require('./checkout-products');

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
