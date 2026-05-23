import type { RequestHandler } from 'express';

import { getAuthenticatedUser } from '../../middleware/require-session.js';
import { createDatasetSchema, createDatasetVersionSchema } from './dataset.schemas.js';
import {
  createUserDataset,
  createUserDatasetVersion,
  deleteUserDataset,
  getUserDatasetDetails,
  getUserDatasetDownload,
  listUserDatasets,
} from './dataset.service.js';

function getRouteParam(value: string | string[] | undefined): string {
  return Array.isArray(value) ? value[0] : (value ?? '');
}

export const listDatasetsController: RequestHandler = (request, response, next) => {
  try {
    const user = getAuthenticatedUser(request);

    response.status(200).json({ data: listUserDatasets(user.id) });
  } catch (error) {
    next(error);
  }
};

export const getDatasetDetailsController: RequestHandler = (request, response, next) => {
  try {
    const user = getAuthenticatedUser(request);

    response.status(200).json({
      data: getUserDatasetDetails(getRouteParam(request.params.datasetId), user.id),
    });
  } catch (error) {
    next(error);
  }
};

export const downloadDatasetController: RequestHandler = (request, response, next) => {
  try {
    const user = getAuthenticatedUser(request);
    const version = getUserDatasetDownload(getRouteParam(request.params.datasetId), user.id);

    response.download(version.originalFilePath, version.originalFilename);
  } catch (error) {
    next(error);
  }
};

export const createDatasetController: RequestHandler = (request, response, next) => {
  try {
    const user = getAuthenticatedUser(request);
    const payload = createDatasetSchema.parse(request.body);

    response.status(201).json({
      data: createUserDataset({
        userId: user.id,
        uploadId: payload.uploadId,
        name: payload.name,
        mapping: payload.mapping,
      }),
    });
  } catch (error) {
    next(error);
  }
};

export const createDatasetVersionController: RequestHandler = (request, response, next) => {
  try {
    const user = getAuthenticatedUser(request);
    const payload = createDatasetVersionSchema.parse(request.body);

    response.status(201).json({
      data: createUserDatasetVersion({
        userId: user.id,
        datasetId: getRouteParam(request.params.datasetId),
        uploadId: payload.uploadId,
        mapping: payload.mapping,
      }),
    });
  } catch (error) {
    next(error);
  }
};

export const deleteDatasetController: RequestHandler = (request, response, next) => {
  try {
    const user = getAuthenticatedUser(request);

    deleteUserDataset(getRouteParam(request.params.datasetId), user.id);
    response.status(204).send();
  } catch (error) {
    next(error);
  }
};
