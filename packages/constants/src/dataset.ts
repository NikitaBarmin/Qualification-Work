export const REQUIRED_DATASET_COLUMNS = [
  'date',
  'channel',
  'spend',
  'traffic_leads',
  'new_orders',
  'returning_orders',
  'revenue',
] as const;

export const DATASET_COLUMN_LABELS = {
  date: 'Дата',
  channel: 'Канал',
  spend: 'Расходы',
  traffic_leads: 'Лиды',
  new_orders: 'Новые заказы',
  returning_orders: 'Повторные заказы',
  revenue: 'Выручка',
} as const;

export const DATASET_COLUMN_TYPES = ['date', 'string', 'number', 'money', 'unknown'] as const;

export const UPLOAD_SESSION_STATUSES = [
  'uploaded',
  'previewed',
  'mapped',
  'expired',
  'failed',
] as const;

export const DATASET_VERSION_STATUSES = ['draft', 'processing', 'ready', 'failed'] as const;

export const PREVIEW_ROW_LIMIT = 30;
export const FIRST_EXCEL_SHEET_INDEX = 0;
export const DEFAULT_CURRENCY_CODE = 'RUB';
