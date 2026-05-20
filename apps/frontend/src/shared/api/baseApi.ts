import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

import { appEnv } from '@/shared/config/env';

export const baseApi = createApi({
  reducerPath: 'baseApi',
  baseQuery: fetchBaseQuery({
    baseUrl: appEnv.apiBaseUrl,
    credentials: 'include',
    prepareHeaders: (headers) => {
      headers.set('Accept', 'application/json');

      return headers;
    },
  }),
  tagTypes: ['Session', 'Dataset', 'Analysis'],
  endpoints: () => ({}),
});
