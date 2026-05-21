import { safeDivide, toPercent } from './helpers';
import type { AnalyticsTotals, MetricValueMap } from './types';

export function calculateDrr(totalSpend: number, totalRevenue: number) {
  return toPercent(safeDivide(totalSpend, totalRevenue));
}

export function calculateRomi(totalRevenue: number, totalSpend: number) {
  return toPercent(safeDivide(totalRevenue - totalSpend, totalSpend));
}

export function calculateLtv(totalRevenue: number, totalUniqueCustomers: number) {
  return safeDivide(totalRevenue, totalUniqueCustomers);
}

export function calculateCac(totalSpend: number, newOrders: number) {
  return safeDivide(totalSpend, newOrders);
}

export function calculateLtvCacRatio(ltv: number, cac: number) {
  return safeDivide(ltv, cac);
}

export function calculateCpo(totalSpend: number, totalOrders: number) {
  return safeDivide(totalSpend, totalOrders);
}

export function calculateCr(totalOrders: number, trafficLeads: number) {
  return toPercent(safeDivide(totalOrders, trafficLeads));
}

export function calculateRetentionRate(returningOrders: number, totalOrders: number) {
  return toPercent(safeDivide(returningOrders, totalOrders));
}

export function calculateTotalOrders(newOrders: number, returningOrders: number) {
  return newOrders + returningOrders;
}

export function buildMetricsFromTotals(totals: AnalyticsTotals): MetricValueMap {
  const totalOrders =
    totals.totalOrders || calculateTotalOrders(totals.newOrders, totals.returningOrders);
  const ltv = calculateLtv(totals.totalRevenue, totals.totalUniqueCustomers);
  const cac = calculateCac(totals.totalSpend, totals.newOrders);

  return {
    drr: calculateDrr(totals.totalSpend, totals.totalRevenue),
    romi: calculateRomi(totals.totalRevenue, totals.totalSpend),
    ltv,
    cac,
    ltvCacRatio: calculateLtvCacRatio(ltv, cac),
    cpo: calculateCpo(totals.totalSpend, totalOrders),
    cr: calculateCr(totalOrders, totals.trafficLeads),
    retentionRate: calculateRetentionRate(totals.returningOrders, totalOrders),
  };
}
