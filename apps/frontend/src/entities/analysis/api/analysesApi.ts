import type {
  IAnalysisDetails,
  IAnalysisListItem,
  ICreateAnalysisPayload,
} from '@/entities/analysis/model/types/analysis';
import { apiRoutes, baseApi, unwrapResponse } from '@/shared/api';

export const analysesApi = baseApi.injectEndpoints({
  overrideExisting: false,
  endpoints: (builder) => ({
    getAnalysesList: builder.query<IAnalysisListItem[], void>({
      query: () => ({
        url: apiRoutes.analyses.list,
        method: 'GET',
      }),
      providesTags: ['Analysis'],
      transformResponse: (response: IAnalysisListItem[] | { data: IAnalysisListItem[] }) =>
        unwrapResponse(response),
    }),
    getAnalysisById: builder.query<IAnalysisDetails, string>({
      query: (analysisId) => ({
        url: apiRoutes.analyses.details(analysisId),
        method: 'GET',
      }),
      providesTags: ['Analysis'],
      transformResponse: (response: IAnalysisDetails | { data: IAnalysisDetails }) =>
        unwrapResponse(response),
    }),
    createAnalysis: builder.mutation<IAnalysisDetails, ICreateAnalysisPayload>({
      query: (body) => ({
        url: apiRoutes.analyses.create,
        method: 'POST',
        body,
      }),
      invalidatesTags: ['Analysis', 'Dataset'],
      transformResponse: (response: IAnalysisDetails | { data: IAnalysisDetails }) =>
        unwrapResponse(response),
    }),
  }),
});

export const { useCreateAnalysisMutation, useGetAnalysesListQuery, useGetAnalysisByIdQuery } =
  analysesApi;
