import { skipToken } from '@reduxjs/toolkit/query';
import {
  Alert,
  Button,
  Empty,
  Input,
  message,
  Modal,
  Progress,
  Select,
  Spin,
  Table,
  Tag,
  Upload,
} from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';

import uploadIcon from '@/app/assets/new-analyze-empty-section/drag-and-drop-file.svg';
import addRowIcon from '@/app/assets/new-analyze-section/add-string.svg';
import analyzeIcon from '@/app/assets/new-analyze-section/analyze.svg';
import changeFileIcon from '@/app/assets/new-analyze-section/change-file.svg';
import saveDatasetIcon from '@/app/assets/new-analyze-section/save-dataset.svg';
import { useCreateAnalysisMutation } from '@/entities/analysis';
import {
  useCreateDatasetMutation,
  useGetDatasetByIdQuery,
  useUpdateDatasetDraftMutation,
  useUploadDatasetPreviewMutation,
  type DatasetCellValue,
  type DatasetColumnKey,
  type DatasetColumnMapping,
  type DatasetColumnType,
  type IDatasetEditPatch,
  type IDatasetPreviewColumn,
  type IUploadPreviewResponse,
} from '@/entities/dataset';
import { getApiErrorMessage } from '@/shared/api';
import { useAppSelector } from '@/shared/lib/store';

import styles from './NewAnalysisPage.module.scss';

interface IRequiredColumn {
  key: DatasetColumnKey;
  label: string;
  type: DatasetColumnType;
}

interface IEditableRow {
  _rowKey: string;
  _sourceIndex?: number;
  [key: string]: DatasetCellValue | string | number | undefined;
}

interface ILoadedDraft {
  datasetId: string;
  versionId: string;
  filename: string;
  rowCount: number | null;
  columns: IDatasetPreviewColumn[];
  rows: IEditableRow[];
  mapping: DatasetColumnMapping;
  editPatch: IDatasetEditPatch | null;
}

interface IPersistedNewAnalysisDraft {
  draft: ILoadedDraft;
  originalRows: Record<string, DatasetCellValue>[];
  deletedRows: number[];
}

const ACTIVE_DRAFT_STORAGE_KEY = 'businesspulse:new-analysis:draft:v1';

const ANALYSIS_PROGRESS_DURATION_MS = 30_000;
const ANALYSIS_PROGRESS_STAGES = [
  { percent: 8, label: 'Сохраняем правки датасета' },
  { percent: 22, label: 'Запускаем ETL и очистку данных' },
  { percent: 42, label: 'Считаем KPI и канальную диагностику' },
  { percent: 62, label: 'Ищем аномалии и стратегические сигналы' },
  { percent: 78, label: 'Формируем AI-рекомендации и SWOT' },
  { percent: 92, label: 'Собираем финальный дашборд' },
];

const REQUIRED_COLUMNS: IRequiredColumn[] = [
  { key: 'date', label: 'Дата', type: 'date' },
  { key: 'channel', label: 'Канал', type: 'string' },
  { key: 'spend', label: 'Расходы', type: 'money' },
  { key: 'traffic_leads', label: 'Трафик / лиды', type: 'number' },
  { key: 'new_orders', label: 'Новые заказы', type: 'number' },
  { key: 'returning_orders', label: 'Повторные заказы', type: 'number' },
  { key: 'revenue', label: 'Выручка', type: 'money' },
];

function toEditableRows(rows: Record<string, DatasetCellValue>[]): IEditableRow[] {
  return rows.map((row, index) => ({
    ...row,
    _rowKey: `source-${index}`,
    _sourceIndex: index,
  }));
}

function normalizeCellValue(
  value: DatasetCellValue | string | number | undefined,
): DatasetCellValue {
  if (value === undefined || value === '') {
    return null;
  }

  return value as DatasetCellValue;
}

function toPlainRow(row: IEditableRow, headers: string[]) {
  return Object.fromEntries(headers.map((header) => [header, normalizeCellValue(row[header])]));
}

function buildMappingFromAuto(
  columns: IDatasetPreviewColumn[],
  autoMapping: Partial<Record<DatasetColumnKey, string>>,
) {
  return REQUIRED_COLUMNS.reduce<DatasetColumnMapping>((mapping, column) => {
    const source = autoMapping[column.key];

    if (!source) {
      return mapping;
    }

    const previewColumn = columns.find((item) => item.name === source);
    mapping[column.key] = {
      source,
      required: true,
      type: column.type === 'money' ? 'money' : (previewColumn?.inferredType ?? column.type),
    };

    return mapping;
  }, {});
}

function applyPatchToRows(
  rows: Record<string, DatasetCellValue>[],
  editPatch: IDatasetEditPatch | null,
) {
  if (!editPatch) {
    return toEditableRows(rows);
  }

  const deletedRows = new Set(editPatch.deletedRows);
  const updatedRows = new Map(editPatch.updatedRows.map((row) => [row.rowIndex, row.values]));
  const patchedRows = rows
    .map((row, index) => ({
      row: {
        ...row,
        ...updatedRows.get(index),
      },
      sourceIndex: index,
    }))
    .filter((item) => !deletedRows.has(item.sourceIndex))
    .map((item) => ({
      ...item.row,
      _rowKey: `source-${item.sourceIndex}`,
      _sourceIndex: item.sourceIndex,
    }));

  return [
    ...patchedRows,
    ...editPatch.addedRows.map((row, index) => ({
      ...row,
      _rowKey: `added-${index}`,
    })),
  ];
}

function buildPatch(
  originalRows: Record<string, DatasetCellValue>[],
  rows: IEditableRow[],
  headers: string[],
  deletedRows: number[],
): IDatasetEditPatch {
  const updatedRows = rows
    .filter((row) => typeof row._sourceIndex === 'number')
    .map((row) => {
      const rowIndex = row._sourceIndex as number;
      const values = toPlainRow(row, headers);
      const original = originalRows[rowIndex] ?? {};
      const isChanged = headers.some((header) => values[header] !== original[header]);

      return isChanged ? { rowIndex, values } : null;
    })
    .filter((row): row is { rowIndex: number; values: Record<string, DatasetCellValue> } =>
      Boolean(row),
    );
  const addedRows = rows
    .filter((row) => row._sourceIndex === undefined)
    .map((row) => toPlainRow(row, headers));

  return {
    updatedRows,
    addedRows,
    deletedRows: [...new Set(deletedRows)].sort((left, right) => left - right),
  };
}

function countMissingValues(rows: IEditableRow[], headers: string[]) {
  return rows.reduce((count, row) => {
    const missingInRow = headers.some((header) => row[header] === null || row[header] === '');
    return count + (missingInRow ? 1 : 0);
  }, 0);
}

function getMappedColumnKeyForSource(
  mapping: DatasetColumnMapping,
  source: string,
): DatasetColumnKey | undefined {
  const entry = Object.entries(mapping).find(([, rule]) => rule?.source === source);

  return entry?.[0] as DatasetColumnKey | undefined;
}

function readPersistedDraft(): IPersistedNewAnalysisDraft | null {
  try {
    const value = window.sessionStorage.getItem(ACTIVE_DRAFT_STORAGE_KEY);

    return value ? (JSON.parse(value) as IPersistedNewAnalysisDraft) : null;
  } catch {
    return null;
  }
}

function persistDraftSnapshot(snapshot: IPersistedNewAnalysisDraft | null) {
  try {
    if (!snapshot) {
      window.sessionStorage.removeItem(ACTIVE_DRAFT_STORAGE_KEY);
      return;
    }

    window.sessionStorage.setItem(ACTIVE_DRAFT_STORAGE_KEY, JSON.stringify(snapshot));
  } catch {
    // Storage can be disabled by the browser. The page still works without persistence.
  }
}

export function NewAnalysisPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const datasetIdFromUrl = searchParams.get('datasetId');
  const sessionStatus = useAppSelector((state) => state.session.status);
  const [messageApi, contextHolder] = message.useMessage();
  const tablePanelRef = useRef<HTMLDivElement | null>(null);
  const analysisTimerRef = useRef<number | null>(null);
  const persistedDraftRef = useRef<IPersistedNewAnalysisDraft | null>(
    datasetIdFromUrl ? null : readPersistedDraft(),
  );
  const [draft, setDraft] = useState<ILoadedDraft | null>(
    () => persistedDraftRef.current?.draft ?? null,
  );
  const [originalRows, setOriginalRows] = useState<Record<string, DatasetCellValue>[]>(
    () => persistedDraftRef.current?.originalRows ?? [],
  );
  const [deletedRows, setDeletedRows] = useState<number[]>(
    () => persistedDraftRef.current?.deletedRows ?? [],
  );
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [analysisProgress, setAnalysisProgress] = useState<{
    percent: number;
    label: string;
  } | null>(null);
  const [uploadDatasetPreview, uploadState] = useUploadDatasetPreviewMutation();
  const [createDataset, createDatasetState] = useCreateDatasetMutation();
  const [updateDatasetDraft, updateDraftState] = useUpdateDatasetDraftMutation();
  const [createAnalysis, createAnalysisState] = useCreateAnalysisMutation();
  const {
    data: datasetDetails,
    error: datasetError,
    isFetching: isDatasetFetching,
  } = useGetDatasetByIdQuery(datasetIdFromUrl ?? skipToken);
  const isBusy =
    uploadState.isLoading ||
    createDatasetState.isLoading ||
    updateDraftState.isLoading ||
    createAnalysisState.isLoading;

  const clearAnalysisProgressTimer = () => {
    if (analysisTimerRef.current === null) {
      return;
    }

    window.clearInterval(analysisTimerRef.current);
    analysisTimerRef.current = null;
  };

  const startAnalysisProgress = () => {
    clearAnalysisProgressTimer();
    const startedAt = Date.now();
    const firstStage = ANALYSIS_PROGRESS_STAGES[0];

    setAnalysisProgress(firstStage);
    analysisTimerRef.current = window.setInterval(() => {
      const elapsed = Date.now() - startedAt;
      const targetPercent = Math.min(
        92,
        Math.round(firstStage.percent + (elapsed / ANALYSIS_PROGRESS_DURATION_MS) * 84),
      );
      const stage =
        [...ANALYSIS_PROGRESS_STAGES].reverse().find((item) => targetPercent >= item.percent) ??
        firstStage;

      setAnalysisProgress((current) => ({
        percent: Math.max(current?.percent ?? 0, targetPercent),
        label: stage.label,
      }));
    }, 700);
  };

  const finishAnalysisProgress = () => {
    clearAnalysisProgressTimer();
    setAnalysisProgress({
      percent: 100,
      label: 'Дашборд готов',
    });
  };

  const resetAnalysisProgress = () => {
    clearAnalysisProgressTimer();
    setAnalysisProgress(null);
  };

  useEffect(
    () => () => {
      clearAnalysisProgressTimer();
    },
    [],
  );

  useEffect(() => {
    if (!datasetDetails?.currentVersion) {
      return;
    }

    const currentVersion = datasetDetails.currentVersion;
    const previewRows = currentVersion.previewRows ?? [];

    setOriginalRows(previewRows);
    setDeletedRows(currentVersion.editPatch?.deletedRows ?? []);
    setDraft({
      datasetId: datasetDetails.id,
      versionId: currentVersion.id,
      filename: currentVersion.originalFilename,
      rowCount: currentVersion.rowCount,
      columns: currentVersion.inferredColumns,
      rows: applyPatchToRows(previewRows, currentVersion.editPatch),
      mapping:
        Object.keys(currentVersion.mappingConfig).length > 0
          ? currentVersion.mappingConfig
          : buildMappingFromAuto(currentVersion.inferredColumns, currentVersion.autoMapping),
      editPatch: currentVersion.editPatch,
    });
  }, [datasetDetails]);

  const headers = useMemo(() => draft?.columns.map((column) => column.name) ?? [], [draft]);
  const mappedRequiredCount = useMemo(
    () => REQUIRED_COLUMNS.filter((column) => draft?.mapping[column.key]?.source).length,
    [draft],
  );
  const missingValueRows = useMemo(
    () => (draft ? countMissingValues(draft.rows, headers) : 0),
    [draft, headers],
  );

  useEffect(() => {
    persistDraftSnapshot(draft ? { draft, originalRows, deletedRows } : null);
  }, [deletedRows, draft, originalRows]);

  useEffect(() => {
    const root = tablePanelRef.current;
    const scrollElement = root?.querySelector<HTMLElement>('.ant-table-content');

    if (!root || !scrollElement) {
      return undefined;
    }

    let isDragging = false;
    let startX = 0;
    let startScrollLeft = 0;

    const isInteractiveTarget = (target: EventTarget | null) =>
      target instanceof HTMLElement &&
      Boolean(
        target.closest('input, textarea, button, a, [role="button"], .ant-select, .ant-pagination'),
      );

    const handleMouseDown = (event: MouseEvent) => {
      if (event.button !== 0 || isInteractiveTarget(event.target)) {
        return;
      }

      isDragging = true;
      startX = event.pageX;
      startScrollLeft = scrollElement.scrollLeft;
      root.classList.add(styles.dragging);
      event.preventDefault();
    };

    const handleMouseMove = (event: MouseEvent) => {
      if (!isDragging) {
        return;
      }

      scrollElement.scrollLeft = startScrollLeft - (event.pageX - startX);
    };

    const stopDragging = () => {
      isDragging = false;
      root.classList.remove(styles.dragging);
    };

    scrollElement.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', stopDragging);

    return () => {
      scrollElement.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', stopDragging);
    };
  }, [draft?.versionId, headers.length]);

  const askAuth = () => {
    Modal.confirm({
      title: 'Нужна авторизация',
      content: 'Чтобы загрузить файл и запустить анализ, войдите в аккаунт или зарегистрируйтесь.',
      okText: 'Зарегистрироваться',
      cancelText: 'Войти',
      centered: true,
      onOk: () => navigate('/sign-up'),
      onCancel: () => navigate('/sign-in'),
    });
  };

  const loadPreviewIntoDraft = async (preview: IUploadPreviewResponse) => {
    const mapping = buildMappingFromAuto(preview.columns, preview.autoMapping);
    const created = await createDataset({
      uploadId: preview.uploadId,
      name: preview.filename,
      mapping,
    }).unwrap();
    const createdDatasetId = created.dataset.id;
    const createdVersion = created.version;
    const editableRows = toEditableRows(preview.previewRows);

    setOriginalRows(preview.previewRows);
    setDeletedRows([]);
    setDraft({
      datasetId: createdDatasetId,
      versionId: createdVersion.id,
      filename: preview.filename,
      rowCount: preview.rowCount,
      columns: preview.columns,
      rows: editableRows,
      mapping,
      editPatch: null,
    });
    navigate(`/analytics/new?datasetId=${createdDatasetId}&versionId=${createdVersion.id}`, {
      replace: true,
    });
  };

  const handleUpload = async () => {
    if (sessionStatus !== 'authenticated') {
      askAuth();
      return;
    }

    if (!selectedFile) {
      messageApi.warning('Выберите Excel или CSV файл');
      return;
    }

    try {
      const preview = await uploadDatasetPreview({ file: selectedFile }).unwrap();
      await loadPreviewIntoDraft(preview);
      setSelectedFile(null);
      messageApi.success('Файл загружен. Проверьте маппинг и превью данных.');
    } catch (error) {
      messageApi.error(getApiErrorMessage(error, 'Не удалось загрузить файл'));
    }
  };

  const updateCell = (rowKey: string, columnName: string, value: string) => {
    setDraft((current) => {
      if (!current) {
        return current;
      }

      return {
        ...current,
        rows: current.rows.map((row) =>
          row._rowKey === rowKey ? { ...row, [columnName]: value } : row,
        ),
      };
    });
  };

  const addRow = () => {
    setDraft((current) => {
      if (!current) {
        return current;
      }

      const emptyRow = Object.fromEntries(headers.map((header) => [header, null]));

      return {
        ...current,
        rows: [
          ...current.rows,
          {
            ...emptyRow,
            _rowKey: `added-${Date.now()}`,
          },
        ],
      };
    });
  };

  const deleteRow = (row: IEditableRow) => {
    if (typeof row._sourceIndex === 'number') {
      setDeletedRows((current) => [...new Set([...current, row._sourceIndex as number])]);
    }

    setDraft((current) =>
      current
        ? {
            ...current,
            rows: current.rows.filter((item) => item._rowKey !== row._rowKey),
          }
        : current,
    );
  };

  const updateSourceMapping = (source: string, columnKey: DatasetColumnKey | null) => {
    setDraft((current) => {
      if (!current) {
        return current;
      }

      const column = REQUIRED_COLUMNS.find((item) => item.key === columnKey);
      const nextMapping = Object.fromEntries(
        Object.entries(current.mapping).filter(
          ([key, rule]) => rule?.source !== source && key !== columnKey,
        ),
      ) as DatasetColumnMapping;

      if (columnKey && column) {
        const previewColumn = current.columns.find((item) => item.name === source);
        nextMapping[columnKey] = {
          source,
          required: true,
          type: column.type === 'money' ? 'money' : (previewColumn?.inferredType ?? column.type),
        };
      }

      return {
        ...current,
        mapping: nextMapping,
      };
    });
  };

  const updateMapping = (columnKey: DatasetColumnKey, source: string | null) => {
    updateSourceMapping(source ?? '', source ? columnKey : null);
  };

  const saveDraft = async () => {
    if (!draft) {
      return null;
    }

    const editPatch = buildPatch(originalRows, draft.rows, headers, deletedRows);

    try {
      const savedVersion = await updateDatasetDraft({
        datasetId: draft.datasetId,
        versionId: draft.versionId,
        mapping: draft.mapping,
        editPatch,
      }).unwrap();

      setDraft((current) =>
        current
          ? {
              ...current,
              editPatch,
              mapping: savedVersion.mappingConfig,
            }
          : current,
      );
      messageApi.success('Датасет сохранен');
      return savedVersion;
    } catch (error) {
      messageApi.error(getApiErrorMessage(error, 'Не удалось сохранить датасет'));
      return null;
    }
  };

  const runAnalysis = async () => {
    if (!draft) {
      return;
    }

    if (mappedRequiredCount === 0) {
      messageApi.warning('Сопоставьте хотя бы одну колонку перед анализом');
      return;
    }

    startAnalysisProgress();
    const savedVersion = await saveDraft();

    if (!savedVersion) {
      resetAnalysisProgress();
      return;
    }

    try {
      const analysis = await createAnalysis({ datasetVersionId: draft.versionId }).unwrap();
      finishAnalysisProgress();
      messageApi.success('Аналитический дашборд готов');
      await new Promise((resolve) => {
        window.setTimeout(resolve, 450);
      });
      navigate(`/analytics/${analysis.id}`);
    } catch (error) {
      resetAnalysisProgress();
      messageApi.error(getApiErrorMessage(error, 'Не удалось запустить анализ'));
    }
  };

  const resetToUpload = () => {
    resetAnalysisProgress();
    persistDraftSnapshot(null);
    setDraft(null);
    setOriginalRows([]);
    setDeletedRows([]);
    setSelectedFile(null);
    navigate('/analytics/new', { replace: true });
  };

  const tableColumns: ColumnsType<IEditableRow> = [
    ...headers.map((header) => {
      const mappedColumnKey = draft
        ? getMappedColumnKeyForSource(draft.mapping, header)
        : undefined;

      return {
        title: (
          <div className={styles.columnHeader}>
            <span title={header}>{header}</span>
            <Select
              allowClear
              size="small"
              value={mappedColumnKey}
              placeholder="Маппинг"
              options={REQUIRED_COLUMNS.map((column) => ({
                label: column.label,
                value: column.key,
              }))}
              onChange={(value) => updateSourceMapping(header, value ?? null)}
              onMouseDown={(event) => event.stopPropagation()}
            />
          </div>
        ),
        dataIndex: header,
        width: 200,
        render: (_: unknown, row: IEditableRow) => (
          <Input
            value={String(row[header] ?? '')}
            onChange={(event) => updateCell(row._rowKey, header, event.target.value)}
          />
        ),
      };
    }),
    {
      title: 'Действия',
      key: 'actions',
      fixed: 'right',
      width: 110,
      render: (_, row) => (
        <Button type="text" danger onClick={() => deleteRow(row)}>
          Удалить
        </Button>
      ),
    },
  ];

  if (isDatasetFetching && !draft) {
    return (
      <div className={styles.centerState}>
        <Spin />
      </div>
    );
  }

  if (datasetError && datasetIdFromUrl && !draft) {
    return (
      <Alert
        showIcon
        type="warning"
        message="Не удалось открыть датасет"
        description={getApiErrorMessage(datasetError, 'Попробуйте выбрать файл заново.')}
        action={<Button onClick={resetToUpload}>Загрузить новый файл</Button>}
      />
    );
  }

  if (!draft) {
    return (
      <section className={styles.uploadPage}>
        {contextHolder}
        <div className={styles.uploadHeader}>
          <h1>Инициализация</h1>
          <p>
            Загрузите сырые бизнес-данные, чтобы проверить структуру, сопоставить колонки и
            подготовить датасет к анализу.
          </p>
        </div>

        <div className={styles.uploadPanel}>
          <Upload.Dragger
            accept=".csv,.xlsx,.xls"
            beforeUpload={(file) => {
              setSelectedFile(file);
              return false;
            }}
            maxCount={1}
            onRemove={() => setSelectedFile(null)}
          >
            <div className={styles.uploadDrop}>
              <img src={uploadIcon} alt="" aria-hidden="true" />
              <h2>Перетащите Excel или CSV файл</h2>
              <p>Поддерживаемые форматы: .xlsx, .xls, .csv</p>
            </div>
          </Upload.Dragger>
          <Button
            type="primary"
            size="large"
            className={styles.primaryButton}
            loading={isBusy}
            onClick={handleUpload}
          >
            Выбрать и обработать файл
          </Button>
          <Tag color="green">Данные будут очищены от дублей и пустых значений на ETL-этапе</Tag>
        </div>
      </section>
    );
  }

  return (
    <section className={styles.page}>
      {contextHolder}
      <div className={styles.datasetHeader}>
        <div>
          <span>Активный набор данных</span>
          <h1>{draft.filename}</h1>
        </div>
        <div className={styles.headerActions}>
          <Button icon={<img src={changeFileIcon} alt="" />} onClick={resetToUpload}>
            Изменить файл
          </Button>
          <Button
            icon={<img src={saveDatasetIcon} alt="" />}
            loading={updateDraftState.isLoading}
            onClick={saveDraft}
          >
            Сохранить датасет
          </Button>
          <Button
            type="primary"
            icon={<img src={analyzeIcon} alt="" />}
            loading={createAnalysisState.isLoading || updateDraftState.isLoading}
            onClick={runAnalysis}
          >
            Анализ
          </Button>
        </div>
      </div>

      {analysisProgress && (
        <div className={styles.analysisProgress}>
          <div className={styles.analysisProgressHeader}>
            <div>
              <span>Статус анализа</span>
              <h2>{analysisProgress.label}</h2>
            </div>
            <strong>{analysisProgress.percent}%</strong>
          </div>
          <Progress
            percent={analysisProgress.percent}
            showInfo={false}
            status={analysisProgress.percent === 100 ? 'success' : 'active'}
          />
          <p>
            Обычно анализ занимает 20-30 секунд: очищаем данные, считаем метрики, строим диагностику
            и формируем рекомендации.
          </p>
        </div>
      )}

      <div className={styles.statsGrid}>
        <div className={styles.statItem}>
          <span>Строки</span>
          <strong>{draft.rowCount ?? draft.rows.length}</strong>
        </div>
        <div className={styles.statItem}>
          <span>Столбцы</span>
          <strong>{headers.length}</strong>
        </div>
        <div className={styles.statItem}>
          <span>Сопоставлено</span>
          <strong>
            {mappedRequiredCount}/{REQUIRED_COLUMNS.length}
          </strong>
        </div>
        <div className={styles.statItem}>
          <span>Строк с пропусками</span>
          <strong>{missingValueRows}</strong>
        </div>
      </div>

      <div className={styles.mappingPanel}>
        <div className={styles.panelTitle}>
          <h2>Маппинг заголовков</h2>
          <p>Сопоставьте обязательные бизнес-поля с колонками вашего файла.</p>
        </div>
        <div className={styles.mappingGrid}>
          {REQUIRED_COLUMNS.map((column) => (
            <label key={column.key} className={styles.mappingItem}>
              <span>{column.label}</span>
              <Select
                allowClear
                value={draft.mapping[column.key]?.source}
                placeholder="Выберите колонку"
                options={headers.map((header) => ({ label: header, value: header }))}
                onChange={(value) => updateMapping(column.key, value)}
              />
            </label>
          ))}
        </div>
      </div>

      <div className={styles.tablePanel} ref={tablePanelRef}>
        <div className={styles.tableToolbar}>
          <div>
            <h2>Превью данных</h2>
            <p>Показаны первые строки файла. Правки сохраняются как draft-патч для ETL.</p>
          </div>
          <Button icon={<img src={addRowIcon} alt="" />} onClick={addRow}>
            Добавить строку
          </Button>
        </div>
        <Table<IEditableRow>
          rowKey="_rowKey"
          columns={tableColumns}
          dataSource={draft.rows}
          pagination={{ pageSize: 20, showSizeChanger: false }}
          scroll={{ x: Math.max(900, headers.length * 210) }}
          locale={{
            emptyText: <Empty description="Нет строк для редактирования" />,
          }}
        />
      </div>
    </section>
  );
}
