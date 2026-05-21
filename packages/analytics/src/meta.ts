import type { MetricDefinition } from './types';

export const METRIC_DEFINITIONS: MetricDefinition[] = [
  {
    id: 'drr',
    label: 'ДРР',
    unit: '%',
    description: 'Доля рекламных расходов в выручке.',
  },
  {
    id: 'romi',
    label: 'ROMI',
    unit: '%',
    description: 'Окупаемость маркетинговых инвестиций.',
  },
  {
    id: 'ltv',
    label: 'LTV',
    unit: 'rub',
    description: 'Упрощенная годовая ценность клиента.',
  },
  {
    id: 'cac',
    label: 'CAC',
    unit: 'rub',
    description: 'Стоимость привлечения нового платящего клиента.',
  },
  {
    id: 'ltvCacRatio',
    label: 'LTV:CAC',
    unit: 'ratio',
    description: 'Соотношение ценности клиента и стоимости его привлечения.',
  },
  {
    id: 'cpo',
    label: 'CPO',
    unit: 'rub',
    description: 'Стоимость получения одного заказа.',
  },
  {
    id: 'cr',
    label: 'CR',
    unit: '%',
    description: 'Конверсия трафика или лидов в заказы.',
  },
  {
    id: 'retentionRate',
    label: 'Retention Rate',
    unit: '%',
    description: 'Доля повторных заказов в общем объеме заказов.',
  },
] as const;
