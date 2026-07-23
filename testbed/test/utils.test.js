import test from 'node:test';
import assert from 'node:assert';
import { calculateTotal, applyDiscount } from '../src/utils.js';
import { checkoutSummary } from '../src/index.js';

test('calculateTotal sums price * qty', () => {
  assert.equal(calculateTotal([{ price: 10, qty: 2 }, { price: 5, qty: 1 }]), 25);
});

test('applyDiscount subtracts percentage', () => {
  assert.equal(applyDiscount(100, 10), 90);
});

test('checkoutSummary combines total and discount', () => {
  const { subtotal, total } = checkoutSummary([{ price: 50, qty: 2 }], 25);
  assert.equal(subtotal, 100);
  assert.equal(total, 75);
});
