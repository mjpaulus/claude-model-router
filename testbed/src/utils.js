export function calculateTotal(items) {
  var total = 0;
  for (var i = 0; i < items.length; i++) {
    total += items[i].price * items[i].qty;
  }
  return total;
}

export function applyDiscount(total, pct) {
  return total - total * (pct / 100);
}
