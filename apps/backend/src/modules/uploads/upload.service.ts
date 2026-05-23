import fs from 'node:fs';
import readline from 'node:readline';
import Papa from 'papaparse';
import xlsx from 'xlsx';

import { AppError } from '../../lib/app-error.js';
import { createUploadSession, updateUploadSessionPreview } from './upload.repository.js';
import type { DatasetColumnKey, DatasetColumnType, IPreviewColumn } from './upload.types.js';

const DEFAULT_MAX_CSV_UPLOAD_FILE_SIZE_BYTES = 50 * 1024 * 1024;
const DEFAULT_MAX_EXCEL_UPLOAD_FILE_SIZE_BYTES = 20 * 1024 * 1024;
const PREVIEW_ROW_LIMIT = 30;

const COLUMN_HINTS: Record<DatasetColumnKey, string[]> = {
  date: ['date', 'дата', 'day', 'день'],
  channel: ['channel', 'канал', 'source', 'источник'],
  spend: ['spend', 'cost', 'расход', 'затрат'],
  traffic_leads: ['lead', 'лид', 'traffic', 'трафик', 'заяв'],
  new_orders: ['new_orders', 'new order', 'новые заказ', 'новых заказ'],
  returning_orders: ['returning', 'repeat', 'повтор', 'возврат'],
  revenue: ['revenue', 'sales', 'выруч', 'доход'],
};

function getFileExtension(filename: string) {
  const dotIndex = filename.lastIndexOf('.');

  return dotIndex === -1 ? '' : filename.slice(dotIndex).toLowerCase();
}

function ensureUploadSize(file: Express.Multer.File) {
  const extension = getFileExtension(file.originalname);
  const limit =
    extension === '.csv'
      ? DEFAULT_MAX_CSV_UPLOAD_FILE_SIZE_BYTES
      : DEFAULT_MAX_EXCEL_UPLOAD_FILE_SIZE_BYTES;

  if (file.size > limit) {
    throw new AppError('Файл слишком большой для загрузки', 413);
  }
}

function parseCsvLine(line: string) {
  const result = Papa.parse<string[]>(line.trim(), {
    delimiter: '',
    skipEmptyLines: false,
  });

  return result.data[0] ?? [];
}

async function readCsvPreview(filePath: string) {
  const stream = fs.createReadStream(filePath);
  const lines = readline.createInterface({
    input: stream,
    crlfDelay: Infinity,
  });
  let headers: string[] = [];
  const previewRows: Record<string, string | number | null>[] = [];

  for await (const line of lines) {
    if (headers.length === 0) {
      headers = parseCsvLine(line).map((header) => header.trim());
      continue;
    }

    const cells = parseCsvLine(line);
    const row = Object.fromEntries(
      headers.map((header, index) => [header, cells[index] === '' ? null : (cells[index] ?? null)]),
    );
    previewRows.push(row);

    if (previewRows.length >= PREVIEW_ROW_LIMIT) {
      break;
    }
  }

  lines.close();
  stream.destroy();

  return { headers, previewRows };
}

function readExcelPreview(filePath: string) {
  const workbook = xlsx.readFile(filePath, {
    sheetRows: PREVIEW_ROW_LIMIT + 1,
  });
  const [sheetName] = workbook.SheetNames;

  if (!sheetName) {
    return { headers: [], previewRows: [] };
  }

  const rows = xlsx.utils.sheet_to_json<Record<string, string | number | null>>(
    workbook.Sheets[sheetName],
    {
      defval: null,
      raw: false,
    },
  );
  const headers = Object.keys(rows[0] ?? {});

  return {
    headers,
    previewRows: rows.slice(0, PREVIEW_ROW_LIMIT),
  };
}

function inferType(values: unknown[]): DatasetColumnType {
  const presentValues = values.filter((value) => value !== null && value !== '');

  if (presentValues.length === 0) {
    return 'unknown';
  }

  const numberMatches = presentValues.filter((value) => {
    const normalized = String(value).replace(/\s/g, '').replace(',', '.').replace('₽', '');
    return Number.isFinite(Number(normalized));
  }).length;
  const dateMatches = presentValues.filter(
    (value) => !Number.isNaN(Date.parse(String(value))),
  ).length;

  if (numberMatches / presentValues.length >= 0.7) {
    return 'number';
  }

  if (dateMatches / presentValues.length >= 0.7) {
    return 'date';
  }

  return 'string';
}

function buildColumns(headers: string[], previewRows: Record<string, unknown>[]): IPreviewColumn[] {
  return headers.map((header, index) => {
    const examples = previewRows
      .map((row) => row[header])
      .filter((value) => value !== undefined)
      .slice(0, 5);

    return {
      name: header,
      index,
      inferredType: inferType(examples),
      examples,
    };
  });
}

function buildAutoMapping(headers: string[]) {
  const autoMapping: Partial<Record<DatasetColumnKey, string>> = {};

  for (const [systemColumn, hints] of Object.entries(COLUMN_HINTS) as Array<
    [DatasetColumnKey, string[]]
  >) {
    const matchedHeader = headers.find((header) => {
      const normalizedHeader = header.toLowerCase();
      return hints.some((hint) => normalizedHeader.includes(hint));
    });

    if (matchedHeader) {
      autoMapping[systemColumn] = matchedHeader;
    }
  }

  return autoMapping;
}

export async function createUploadPreview(input: {
  userId: string;
  file: Express.Multer.File | undefined;
}) {
  if (!input.file) {
    throw new AppError('Файл не найден в запросе', 400);
  }

  ensureUploadSize(input.file);

  const uploadSession = createUploadSession({
    userId: input.userId,
    originalFilename: input.file.originalname,
    originalFilePath: input.file.path,
    mimeType: input.file.mimetype,
    fileSize: input.file.size,
  });
  const extension = getFileExtension(input.file.originalname);
  const preview =
    extension === '.csv'
      ? await readCsvPreview(input.file.path)
      : readExcelPreview(input.file.path);
  const inferredColumns = buildColumns(preview.headers, preview.previewRows);
  const autoMapping = buildAutoMapping(preview.headers);

  const updatedSession = updateUploadSessionPreview({
    uploadSessionId: uploadSession.id,
    previewRows: preview.previewRows,
    inferredColumns,
    autoMapping,
  });

  return {
    uploadId: updatedSession.id,
    filename: updatedSession.originalFilename,
    fileSize: updatedSession.fileSize,
    columns: inferredColumns,
    previewRows: preview.previewRows,
    autoMapping,
    warnings: [],
  };
}
