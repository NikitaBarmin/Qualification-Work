export type MetricId =
  | 'drr'
  | 'romi'
  | 'ltv'
  | 'cac'
  | 'ltvCacRatio'
  | 'cpo'
  | 'cr'
  | 'retentionRate';

export interface AnalyticsTotals {
  totalSpend: number;
  totalRevenue: number;
  totalOrders: number;
  newOrders: number;
  returningOrders: number;
  trafficLeads: number;
  totalUniqueCustomers: number;
}

export interface MetricDefinition {
  id: MetricId;
  label: string;
  unit: '%' | 'rub' | 'ratio';
  description: string;
}

export type MetricValueMap = Record<MetricId, number>;
