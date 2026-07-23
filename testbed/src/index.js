import { calculateTotal, applyDiscount } from './utils.js';

export function checkoutSummary(items, discountPct = 0) {
  const subtotal = calculateTotal(items);
  const total = applyDiscount(subtotal, discountPct);
  return { subtotal, total };
}
