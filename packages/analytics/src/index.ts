export function calculateDrr(totalSpend: number, totalRevenue: number) {
  if (totalRevenue === 0) {
    return 0;
  }

  return (totalSpend / totalRevenue) * 100;
}

export function calculateCpo(totalSpend: number, totalOrders: number) {
  if (totalOrders === 0) {
    return 0;
  }

  return totalSpend / totalOrders;
}

export function calculateRetentionRate(returningOrders: number, totalOrders: number) {
  if (totalOrders === 0) {
    return 0;
  }

  return (returningOrders / totalOrders) * 100;
}
