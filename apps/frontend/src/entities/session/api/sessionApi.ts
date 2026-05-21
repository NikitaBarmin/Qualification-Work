import type {
  ILoginPayload,
  IRegisterPayload,
  ISessionUser,
} from '@/entities/session/model/types/session';
import { apiRoutes, baseApi, unwrapResponse } from '@/shared/api';

export const sessionApi = baseApi.injectEndpoints({
  overrideExisting: false,
  endpoints: (builder) => ({
    getCurrentSession: builder.query<ISessionUser | null, void>({
      query: () => ({
        url: apiRoutes.session.current,
        method: 'GET',
      }),
      providesTags: ['Session'],
      transformResponse: (response: ISessionUser | null | { data: ISessionUser | null }) =>
        unwrapResponse(response),
    }),
    login: builder.mutation<ISessionUser, ILoginPayload>({
      query: (body) => ({
        url: apiRoutes.session.login,
        method: 'POST',
        body,
      }),
      invalidatesTags: ['Session'],
      transformResponse: (response: ISessionUser | { data: ISessionUser }) =>
        unwrapResponse(response),
    }),
    register: builder.mutation<ISessionUser, IRegisterPayload>({
      query: (body) => ({
        url: apiRoutes.session.register,
        method: 'POST',
        body,
      }),
      invalidatesTags: ['Session'],
      transformResponse: (response: ISessionUser | { data: ISessionUser }) =>
        unwrapResponse(response),
    }),
    logout: builder.mutation<void, void>({
      query: () => ({
        url: apiRoutes.session.logout,
        method: 'POST',
      }),
      invalidatesTags: ['Session'],
      transformResponse: () => undefined,
    }),
    startDemo: builder.mutation<ISessionUser | null, void>({
      query: () => ({
        url: apiRoutes.session.demo,
        method: 'POST',
      }),
      invalidatesTags: ['Session'],
      transformResponse: (response: ISessionUser | null | { data: ISessionUser | null }) =>
        unwrapResponse(response),
    }),
  }),
});

export const {
  useGetCurrentSessionQuery,
  useLoginMutation,
  useLogoutMutation,
  useRegisterMutation,
  useStartDemoMutation,
} = sessionApi;
