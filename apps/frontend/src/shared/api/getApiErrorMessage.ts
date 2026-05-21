import type { FetchBaseQueryError } from '@reduxjs/toolkit/query';

interface IApiErrorBody {
  message?: string;
  details?: string[];
}

function isApiErrorBody(value: unknown): value is IApiErrorBody {
  return typeof value === 'object' && value !== null && ('message' in value || 'details' in value);
}

export function getApiErrorMessage(error: unknown, fallback = 'Не удалось выполнить запрос') {
  const queryError = error as FetchBaseQueryError | undefined;

  if (queryError?.status === 'FETCH_ERROR') {
    return 'Сервер недоступен. Проверьте, что backend запущен.';
  }

  if (queryError?.status === 'TIMEOUT_ERROR') {
    return 'Сервер долго не отвечает. Попробуйте ещё раз.';
  }

  if (queryError && 'data' in queryError && isApiErrorBody(queryError.data)) {
    return queryError.data.details?.[0] ?? queryError.data.message ?? fallback;
  }

  return fallback;
}
