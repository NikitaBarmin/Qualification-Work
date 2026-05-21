import type {
  IDatasetListItem,
  IDatasetPreview,
  IPreviewUploadPayload,
  ISaveDatasetDraftPayload,
} from '@/entities/dataset/model/types/dataset';
import { apiRoutes, baseApi, unwrapResponse } from '@/shared/api';

export const datasetsApi = baseApi.injectEndpoints({
  overrideExisting: false,
  endpoints: (builder) => ({
    uploadDatasetPreview: builder.mutation<IDatasetPreview, IPreviewUploadPayload>({
      query: ({ file }) => {
        const formData = new FormData();
        formData.append('file', file);

        return {
          url: apiRoutes.datasets.preview,
          method: 'POST',
          body: formData,
        };
      },
      invalidatesTags: ['Dataset'],
      transformResponse: (response: IDatasetPreview | { data: IDatasetPreview }) =>
        unwrapResponse(response),
    }),
    saveDatasetDraft: builder.mutation<IDatasetListItem, ISaveDatasetDraftPayload>({
      query: (body) => ({
        url: apiRoutes.datasets.draft,
        method: 'POST',
        body,
      }),
      invalidatesTags: ['Dataset'],
      transformResponse: (response: IDatasetListItem | { data: IDatasetListItem }) =>
        unwrapResponse(response),
    }),
  }),
});

export const { useSaveDatasetDraftMutation, useUploadDatasetPreviewMutation } = datasetsApi;
