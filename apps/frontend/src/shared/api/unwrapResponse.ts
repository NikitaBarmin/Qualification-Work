import type { IServerEnvelope } from '@/shared/types/api';

export function unwrapResponse<TData>(
  response: TData | IServerEnvelope<TData>,
): TData {
  if (
    typeof response === 'object' &&
    response !== null &&
    'data' in response
  ) {
    return (response as IServerEnvelope<TData>).data;
  }

  return response;
}
