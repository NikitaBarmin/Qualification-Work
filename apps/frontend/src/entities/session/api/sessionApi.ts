import type {
  ILoginPayload,
  IRegisterPayload,
  ISessionUser,
} from '@/entities/session/model/types/session';
import { apiRoutes, baseApi, unwrapResponse } from '@/shared/api';

import {
  clearSession,
  markSessionInitialized,
  setAuthenticatedSession,
  startGuestSession,
} from '../model/slice/sessionSlice';

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
      async onQueryStarted(_argument, { dispatch, queryFulfilled }) {
        try {
          const { data } = await queryFulfilled;

          if (data) {
            dispatch(setAuthenticatedSession(data));
            return;
          }

          dispatch(clearSession());
        } catch {
          dispatch(clearSession());
        } finally {
          dispatch(markSessionInitialized());
        }
      },
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
      async onQueryStarted(_argument, { dispatch, queryFulfilled }) {
        try {
          const { data } = await queryFulfilled;

          dispatch(setAuthenticatedSession(data));
        } catch {
          // The page that started the mutation shows the actual error message.
        }
      },
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
      async onQueryStarted(_argument, { dispatch, queryFulfilled }) {
        try {
          const { data } = await queryFulfilled;

          dispatch(setAuthenticatedSession(data));
        } catch {
          // The page that started the mutation shows the actual error message.
        }
      },
    }),
    logout: builder.mutation<void, void>({
      query: () => ({
        url: apiRoutes.session.logout,
        method: 'POST',
      }),
      invalidatesTags: ['Session'],
      transformResponse: () => undefined,
      async onQueryStarted(_argument, { dispatch, queryFulfilled }) {
        try {
          await queryFulfilled;
        } finally {
          dispatch(clearSession());
        }
      },
    }),
    startDemo: builder.mutation<ISessionUser | null, void>({
      query: () => ({
        url: apiRoutes.session.demo,
        method: 'POST',
      }),
      invalidatesTags: ['Session'],
      transformResponse: (response: ISessionUser | null | { data: ISessionUser | null }) =>
        unwrapResponse(response),
      async onQueryStarted(_argument, { dispatch, queryFulfilled }) {
        await queryFulfilled;
        dispatch(startGuestSession());
      },
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
