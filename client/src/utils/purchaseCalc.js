export function purchaseCostForOrders(orders, fromDate, toDate) {
  return orders
    .filter((o) => o.date >= fromDate && o.date <= toDate)
    .reduce((sum, o) => sum + (o.total || 0), 0);
}
