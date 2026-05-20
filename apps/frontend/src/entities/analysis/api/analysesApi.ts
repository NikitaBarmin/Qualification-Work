import type {
  IAnalysisDetails,
  IAnalysisListItem,
  IRunAnalysisPayload,
} from '@/entities/analysis/model/types/analysis';

import { apiRoutes } from '@/shared/api/apiRoutes';
import { baseApi } from '@/shared/api/baseApi';
import { unwrapResponse } from '@/shared/api/unwrapResponse';

export const analysesApi = baseApi.injectEndpoints({
  overrideExisting: false,
  endpoints: (builder) => ({
    getAnalysesList: builder.query<IAnalysisListItem[], void>({
      query: () => ({
        url: apiRoutes.analyses.list,
        method: 'GET',
      }),
      providesTags: ['Analysis'],
      transformResponse: (
        response: IAnalysisListItem[] | { data: IAnalysisListItem[] },
      ) => unwrapResponse(response),
    }),
    getAnalysisById: builder.query<IAnalysisDetails, string>({
      query: (analysisId) => ({
        url: apiRoutes.analyses.details(analysisId),
        method: 'GET',
      }),
      providesTags: ['Analysis'],
      transformResponse: (
        response: IAnalysisDetails | { data: IAnalysisDetails },
      ) => unwrapResponse(response),
    }),
    runAnalysis: builder.mutation<
      IAnalysisDetails,
      IRunAnalysisPayload
    >({
      query: (body) => ({
        url: apiRoutes.analyses.run,
        method: 'POST',
        body,
      }),
      invalidatesTags: ['Analysis', 'Dataset'],
      transformResponse: (
        response: IAnalysisDetails | { data: IAnalysisDetails },
      ) => unwrapResponse(response),
    }),
  }),
});

export const {
  useGetAnalysesListQuery,
  useGetAnalysisByIdQuery,
  useRunAnalysisMutation,
} = analysesApi;
