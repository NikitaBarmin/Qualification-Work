export interface IServerEnvelope<TData> {
  data: TData;
  message?: string;
}

export interface IApiErrorPayload {
  message: string;
  code?: string;
  details?: string[];
}
