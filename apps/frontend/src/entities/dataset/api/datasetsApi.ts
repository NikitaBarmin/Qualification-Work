import type {
  ICreateDatasetPayload,
  IDatasetDetails,
  IDatasetListItem,
  IPreviewUploadPayload,
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
      { dataset: IDatasetListItem; version: unknown },
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
          | { dataset: IDatasetListItem; version: unknown }
          | { data: { dataset: IDatasetListItem; version: unknown } },
      ) => unwrapResponse(response),
    }),
    deleteDataset: builder.mutation<void, string>({
      query: (datasetId) => ({
        url: apiRoutes.datasets.details(datasetId),
        method: 'DELETE',
      }),
      invalidatesTags: ['Dataset', 'Analysis'],
    }),
  }),
});

export const {
  useCreateDatasetMutation,
  useDeleteDatasetMutation,
  useGetDatasetByIdQuery,
  useGetDatasetsListQuery,
  useUploadDatasetPreviewMutation,
} = datasetsApi;
