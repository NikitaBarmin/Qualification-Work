import { AppError } from '../../lib/app-error.js';
import { findUploadSessionById, markUploadSessionMapped } from '../uploads/upload.repository.js';
import {
  createDatasetVersion,
  createDatasetWithVersion,
  findDatasetById,
  getNextDatasetVersionNumber,
  listDatasetsByUser,
  listDatasetVersions,
} from './dataset.repository.js';
import type { DatasetColumnMapping } from './dataset.types.js';

function ensureMapping(mapping: DatasetColumnMapping) {
  if (!mapping || Object.keys(mapping).length === 0) {
    throw new AppError('Необходимо сопоставить хотя бы одну колонку', 400);
  }
}

function ensureUploadSessionForUser(uploadId: string, userId: string) {
  const uploadSession = findUploadSessionById(uploadId);

  if (!uploadSession || uploadSession.userId !== userId) {
    throw new AppError('Upload-сессия не найдена', 404);
  }

  if (uploadSession.status !== 'previewed') {
    throw new AppError('Upload-сессия еще не готова для маппинга', 409);
  }

  return uploadSession;
}

export function listUserDatasets(userId: string) {
  return listDatasetsByUser(userId);
}

export function getUserDatasetDetails(datasetId: string, userId: string) {
  const dataset = findDatasetById(datasetId);

  if (!dataset || dataset.userId !== userId) {
    throw new AppError('Датасет не найден', 404);
  }

  return {
    ...dataset,
    versions: listDatasetVersions(datasetId),
  };
}

export function createUserDataset(input: {
  userId: string;
  uploadId: string;
  name: string;
  mapping: DatasetColumnMapping;
}) {
  ensureMapping(input.mapping);

  const uploadSession = ensureUploadSessionForUser(input.uploadId, input.userId);
  const result = createDatasetWithVersion({
    userId: input.userId,
    name: input.name,
    uploadSessionId: uploadSession.id,
    originalFilename: uploadSession.originalFilename,
    originalFilePath: uploadSession.originalFilePath,
    mappingConfig: input.mapping,
  });

  markUploadSessionMapped(uploadSession.id);

  return {
    dataset: result.dataset,
    version: result.version,
  };
}

export function createUserDatasetVersion(input: {
  userId: string;
  datasetId: string;
  uploadId: string;
  mapping: DatasetColumnMapping;
}) {
  ensureMapping(input.mapping);

  const dataset = findDatasetById(input.datasetId);

  if (!dataset || dataset.userId !== input.userId) {
    throw new AppError('Датасет не найден', 404);
  }

  const uploadSession = ensureUploadSessionForUser(input.uploadId, input.userId);
  const version = createDatasetVersion({
    datasetId: dataset.id,
    userId: input.userId,
    uploadSessionId: uploadSession.id,
    versionNumber: getNextDatasetVersionNumber(dataset.id),
    originalFilename: uploadSession.originalFilename,
    originalFilePath: uploadSession.originalFilePath,
    mappingConfig: input.mapping,
  });

  markUploadSessionMapped(uploadSession.id);

  return version;
}
