import type {
  ICreateDatasetPayload,
  IDatasetDetails,
  IDatasetDraftVersion,
  IDatasetListItem,
  IPreviewUploadPayload,
  IUpdateDatasetDraftPayload,
  IUploadPreviewResponse,
} from '@/entities/dataset/model/types/dataset';
import { apiRoutes, baseApi, unwrapResponse } from '@/shared/api';

export const datasetsApi = baseApi.injectEndpoints({
  overrideExisting: false,
  endpoints: (builder) => ({
    getDatasetsList: builder.query<IDatasetListItem[], void>({
      query: () => ({
        url: apiRoutes.datasets.list,
        method: 'GET',
      }),
      providesTags: ['Dataset'],
      transformResponse: (response: IDatasetListItem[] | { data: IDatasetListItem[] }) =>
        unwrapResponse(response),
    }),
    getDatasetById: builder.query<IDatasetDetails, string>({
      query: (datasetId) => ({
        url: apiRoutes.datasets.details(datasetId),
        method: 'GET',
      }),
      providesTags: ['Dataset'],
      transformResponse: (response: IDatasetDetails | { data: IDatasetDetails }) =>
        unwrapResponse(response),
    }),
    uploadDatasetPreview: builder.mutation<IUploadPreviewResponse, IPreviewUploadPayload>({
      query: ({ file }) => {
        const formData = new FormData();
        formData.append('file', file);

        return {
          url: apiRoutes.uploads.preview,
          method: 'POST',
          body: formData,
        };
      },
      transformResponse: (response: IUploadPreviewResponse | { data: IUploadPreviewResponse }) =>
        unwrapResponse(response),
    }),
    createDataset: builder.mutation<
      { dataset: IDatasetListItem; version: IDatasetDraftVersion },
      ICreateDatasetPayload
    >({
      query: (body) => ({
        url: apiRoutes.datasets.create,
        method: 'POST',
        body,
      }),
      invalidatesTags: ['Dataset'],
      transformResponse: (
        response:
          | { dataset: IDatasetListItem; version: IDatasetDraftVersion }
          | { data: { dataset: IDatasetListItem; version: IDatasetDraftVersion } },
      ) => unwrapResponse(response),
    }),
    deleteDataset: builder.mutation<void, string>({
      query: (datasetId) => ({
        url: apiRoutes.datasets.details(datasetId),
        method: 'DELETE',
      }),
      invalidatesTags: ['Dataset', 'Analysis'],
    }),
    updateDatasetDraft: builder.mutation<IDatasetDraftVersion, IUpdateDatasetDraftPayload>({
      query: ({ datasetId, versionId, ...body }) => ({
        url: apiRoutes.datasets.draft(datasetId, versionId),
        method: 'PATCH',
        body,
      }),
      invalidatesTags: ['Dataset'],
      transformResponse: (response: IDatasetDraftVersion | { data: IDatasetDraftVersion }) =>
        unwrapResponse(response),
    }),
  }),
});

export const {
  useCreateDatasetMutation,
  useDeleteDatasetMutation,
  useGetDatasetByIdQuery,
  useGetDatasetsListQuery,
  useUpdateDatasetDraftMutation,
  useUploadDatasetPreviewMutation,
} = datasetsApi;
