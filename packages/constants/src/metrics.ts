export const METRIC_IDS = [
  'drr',
  'romi',
  'ltv',
  'cac',
  'ltvCacRatio',
  'cpo',
  'cr',
  'retentionRate',
] as const;

export const METRIC_LABELS = {
  drr: 'ДРР',
  romi: 'ROMI',
  ltv: 'LTV',
  cac: 'CAC',
  ltvCacRatio: 'LTV:CAC',
  cpo: 'CPO',
  cr: 'CR',
  retentionRate: 'Retention Rate',
} as const;

export const METRIC_UNITS = {
  drr: '%',
  romi: '%',
  ltv: 'rub',
  cac: 'rub',
  ltvCacRatio: 'ratio',
  cpo: 'rub',
  cr: '%',
  retentionRate: '%',
} as const;
