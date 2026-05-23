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
  updateDatasetVersionDraft,
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

function toDatasetVersionDraftView(version: IDatasetVersionRecord | null) {
  if (!version) {
    return null;
  }

  const uploadSession = version.uploadSessionId
    ? findUploadSessionById(version.uploadSessionId)
    : null;

  return {
    ...toDatasetVersionView(version),
    mappingConfig: version.mappingConfig,
    editPatch: version.editPatch,
    previewRows: uploadSession?.previewRows ?? [],
    inferredColumns: uploadSession?.inferredColumns ?? [],
    autoMapping: uploadSession?.autoMapping ?? {},
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
    currentVersion: toDatasetVersionDraftView(findDatasetCurrentVersion(datasetId)),
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
    dataset: result.dataset
      ? {
          ...result.dataset,
          currentVersion: toDatasetVersionView(result.version),
        }
      : null,
    version: toDatasetVersionDraftView(result.version),
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

  return toDatasetVersionDraftView(version);
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

export function updateUserDatasetDraft(input: {
  userId: string;
  datasetId: string;
  datasetVersionId: string;
  mapping: DatasetColumnMapping;
  editPatch: Record<string, unknown> | null;
}) {
  const dataset = findDatasetById(input.datasetId);

  if (!dataset || dataset.userId !== input.userId) {
    throw new AppError('Датасет не найден', 404);
  }

  const version = findDatasetVersionById(input.datasetVersionId);

  if (!version || version.datasetId !== dataset.id || version.userId !== input.userId) {
    throw new AppError('Версия датасета не найдена', 404);
  }

  return toDatasetVersionDraftView(
    updateDatasetVersionDraft({
      datasetVersionId: version.id,
      mappingConfig: input.mapping,
      editPatch: input.editPatch,
    }),
  );
}
