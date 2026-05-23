import { AppError } from '../../lib/app-error.js';
import { findUploadSessionById, markUploadSessionMapped } from '../uploads/upload.repository.js';
import {
  createDatasetVersion,
  createDatasetWithVersion,
  deleteDatasetById,
  findDatasetById,
  findDatasetCurrentVersion,
  findDatasetVersionById,
  getNextDatasetVersionNumber,
  listDatasetsByUser,
  listDatasetVersions,
} from './dataset.repository.js';
import type { DatasetColumnMapping, IDatasetVersionRecord } from './dataset.types.js';

function toDatasetVersionView(version: IDatasetVersionRecord | null) {
  if (!version) {
    return null;
  }

  return {
    id: version.id,
    datasetId: version.datasetId,
    uploadSessionId: version.uploadSessionId,
    versionNumber: version.versionNumber,
    originalFilename: version.originalFilename,
    status: version.status,
    rowCount: version.rowCount,
    createdAt: version.createdAt,
    completedAt: version.completedAt,
  };
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
  return listDatasetsByUser(userId).map((dataset) => ({
    ...dataset,
    currentVersion: toDatasetVersionView(findDatasetCurrentVersion(dataset.id)),
  }));
}

export function getUserDatasetDetails(datasetId: string, userId: string) {
  const dataset = findDatasetById(datasetId);

  if (!dataset || dataset.userId !== userId) {
    throw new AppError('Датасет не найден', 404);
  }

  return {
    ...dataset,
    versions: listDatasetVersions(datasetId).map(toDatasetVersionView),
  };
}

export function createUserDataset(input: {
  userId: string;
  uploadId: string;
  name: string;
  mapping: DatasetColumnMapping;
}) {
  const uploadSession = ensureUploadSessionForUser(input.uploadId, input.userId);
  const result = createDatasetWithVersion({
    userId: input.userId,
    name: input.name,
    uploadSessionId: uploadSession.id,
    originalFilename: uploadSession.originalFilename,
    originalFilePath: uploadSession.originalFilePath,
    rowCount: uploadSession.rowCount,
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
    rowCount: uploadSession.rowCount,
    mappingConfig: input.mapping,
  });

  markUploadSessionMapped(uploadSession.id);

  return version;
}

export function deleteUserDataset(datasetId: string, userId: string) {
  const dataset = findDatasetById(datasetId);

  if (!dataset || dataset.userId !== userId) {
    throw new AppError('Датасет не найден', 404);
  }

  deleteDatasetById(dataset.id);
}

export function getUserDatasetDownload(datasetId: string, userId: string) {
  const dataset = findDatasetById(datasetId);

  if (!dataset || dataset.userId !== userId || !dataset.currentVersionId) {
    throw new AppError('Датасет не найден', 404);
  }

  const version = findDatasetVersionById(dataset.currentVersionId);

  if (!version) {
    throw new AppError('Версия датасета не найдена', 404);
  }

  return version;
}
