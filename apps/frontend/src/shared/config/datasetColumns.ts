export const REQUIRED_DATASET_COLUMNS = [
  'Date',
  'Channel',
  'Spend',
  'Traffic_Leads',
  'New_Orders',
  'Returning_Orders',
  'Revenue',
] as const;

export type RequiredDatasetColumn =
  (typeof REQUIRED_DATASET_COLUMNS)[number];
