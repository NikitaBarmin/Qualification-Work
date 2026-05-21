export const ALLOWED_FILE_EXTENSIONS = ['.csv', '.xlsx', '.xls'] as const;

export const ALLOWED_FILE_MIME_TYPES = [
  'text/csv',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
] as const;

export const DEFAULT_MAX_UPLOAD_FILE_SIZE_BYTES = 10 * 1024 * 1024;
