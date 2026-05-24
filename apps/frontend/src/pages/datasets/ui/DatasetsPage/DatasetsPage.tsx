import { Alert, Button, Empty, message, Modal, Popconfirm, Table, Tag, Upload } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import deleteIcon from '@/app/assets/my-datasets-section/actions-delete.svg';
import downloadIcon from '@/app/assets/my-datasets-section/actions-load.svg';
import fileIcon from '@/app/assets/my-datasets-section/file-name.svg';
import {
  useCreateDatasetMutation,
  useDeleteDatasetMutation,
  useGetDatasetsListQuery,
  useUploadDatasetPreviewMutation,
  type DatasetColumnKey,
  type DatasetColumnMapping,
  type DatasetVersionStatus,
  type IDatasetListItem,
  type IUploadPreviewResponse,
} from '@/entities/dataset';
import { apiRoutes } from '@/shared/api';
import { getApiErrorMessage } from '@/shared/api/getApiErrorMessage';
import { appEnv } from '@/shared/config/env';
import { useAppSelector } from '@/shared/lib/store';

import styles from './DatasetsPage.module.scss';

const PAGE_SIZE = 5;

const REQUIRED_COLUMNS: DatasetColumnKey[] = [
  'date',
  'channel',
  'spend',
  'traffic_leads',
  'new_orders',
  'returning_orders',
  'revenue',
];

const STATUS_VIEW: Record<DatasetVersionStatus, { label: string; color: string }> = {
  draft: {
    label: 'Черновик',
    color: 'blue',
  },
  failed: {
    label: 'Ошибка',
    color: 'red',
  },
  processing: {
    label: 'Обработка',
    color: 'geekblue',
  },
  ready: {
    label: 'Готов',
    color: 'green',
  },
};

function formatDate(value: string) {
  return new Intl.DateTimeFormat('ru-RU', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(new Date(value));
}

function formatRowsCount(value: number | null | undefined) {
  return typeof value === 'number' ? new Intl.NumberFormat('ru-RU').format(value) : '—';
}

function getDatasetFilename(dataset: IDatasetListItem) {
  return dataset.currentVersion?.originalFilename ?? dataset.name;
}

function buildAutoMapping(preview: IUploadPreviewResponse): DatasetColumnMapping {
  return REQUIRED_COLUMNS.reduce<DatasetColumnMapping>((mapping, columnKey) => {
    const source = preview.autoMapping[columnKey];

    if (!source) {
      return mapping;
    }

    const previewColumn = preview.columns.find((column) => column.name === source);
    mapping[columnKey] = {
      source,
      required: true,
      type: previewColumn?.inferredType ?? 'unknown',
    };

    return mapping;
  }, {});
}

export function DatasetsPage() {
  const navigate = useNavigate();
  const sessionStatus = useAppSelector((state) => state.session.status);
  const [messageApi, contextHolder] = message.useMessage();
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [page, setPage] = useState(1);
  const { data: datasets = [], error, isFetching, isLoading } = useGetDatasetsListQuery();
  const [uploadDatasetPreview, uploadState] = useUploadDatasetPreviewMutation();
  const [createDataset, createState] = useCreateDatasetMutation();
  const [deleteDataset, deleteState] = useDeleteDatasetMutation();
  const isUploading = uploadState.isLoading || createState.isLoading;

  useEffect(() => {
    const lastPage = Math.max(1, Math.ceil(datasets.length / PAGE_SIZE));

    if (page > lastPage) {
      setPage(lastPage);
    }
  }, [datasets.length, page]);

  const visibleDatasets = useMemo(
    () => datasets.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE),
    [datasets, page],
  );

  const openDataset = (dataset: IDatasetListItem) => {
    if (dataset.latestAnalysis) {
      navigate(`/analytics/${dataset.latestAnalysis.id}`);
      return;
    }

    const params = new URLSearchParams({ datasetId: dataset.id });

    if (dataset.currentVersionId) {
      params.set('versionId', dataset.currentVersionId);
    }

    navigate(`/analytics/new?${params.toString()}`);
  };

  const downloadDataset = (dataset: IDatasetListItem) => {
    window.open(`${appEnv.apiBaseUrl}${apiRoutes.datasets.download(dataset.id)}`, '_blank');
  };

  const handleDelete = async (dataset: IDatasetListItem) => {
    try {
      await deleteDataset(dataset.id).unwrap();
      messageApi.success('Датасет удален');
    } catch (requestError) {
      messageApi.error(getApiErrorMessage(requestError, 'Не удалось удалить датасет'));
    }
  };

  const handleOpenUpload = () => {
    if (sessionStatus === 'authenticated') {
      setIsUploadOpen(true);
      return;
    }

    Modal.confirm({
      title: 'Нужна авторизация',
      content: 'Чтобы загрузить файл и сохранить датасет, войдите в аккаунт или зарегистрируйтесь.',
      okText: 'Зарегистрироваться',
      cancelText: 'Войти',
      centered: true,
      onOk: () => navigate('/sign-up'),
      onCancel: () => navigate('/sign-in'),
    });
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      messageApi.warning('Выберите файл для загрузки');
      return;
    }

    try {
      const preview = await uploadDatasetPreview({ file: selectedFile }).unwrap();

      await createDataset({
        uploadId: preview.uploadId,
        name: preview.filename,
        mapping: buildAutoMapping(preview),
      }).unwrap();

      setPage(1);
      setSelectedFile(null);
      setIsUploadOpen(false);
      messageApi.success('Файл добавлен в датасеты');
    } catch (requestError) {
      messageApi.error(getApiErrorMessage(requestError, 'Не удалось загрузить файл'));
    }
  };

  const columns: ColumnsType<IDatasetListItem> = [
    {
      title: 'Имя файла',
      dataIndex: 'name',
      render: (_, dataset) => (
        <div className={styles.fileCell}>
          <img src={fileIcon} alt="" aria-hidden="true" />
          <span>{getDatasetFilename(dataset)}</span>
        </div>
      ),
    },
    {
      title: 'Дата загрузки',
      dataIndex: 'createdAt',
      width: 150,
      render: (value: string) => formatDate(value),
    },
    {
      title: 'Кол-во строк',
      dataIndex: ['currentVersion', 'rowCount'],
      width: 140,
      render: (_, dataset) => formatRowsCount(dataset.currentVersion?.rowCount),
    },
    {
      title: 'Статус',
      dataIndex: ['currentVersion', 'status'],
      width: 140,
      render: (_, dataset) => {
        const status = dataset.currentVersion?.status ?? 'draft';
        const view = STATUS_VIEW[status];

        return (
          <Tag color={dataset.latestAnalysis ? 'green' : view.color}>
            {dataset.latestAnalysis ? 'Проанализирован' : view.label}
          </Tag>
        );
      },
    },
    {
      title: 'Действия',
      key: 'actions',
      align: 'right',
      width: 190,
      render: (_, dataset) => (
        <div className={styles.actions}>
          <Button type="link" className={styles.openButton} onClick={() => openDataset(dataset)}>
            Открыть
          </Button>
          <Button
            type="text"
            className={styles.iconButton}
            aria-label="Скачать файл"
            onClick={() => downloadDataset(dataset)}
          >
            <img src={downloadIcon} alt="" aria-hidden="true" />
          </Button>
          <Popconfirm
            title="Удалить датасет?"
            description="Запись исчезнет из списка датасетов."
            okText="Удалить"
            cancelText="Отмена"
            okButtonProps={{ danger: true }}
            onConfirm={() => handleDelete(dataset)}
          >
            <Button
              type="text"
              danger
              loading={deleteState.isLoading}
              className={styles.iconButton}
              aria-label="Удалить файл"
            >
              <img src={deleteIcon} alt="" aria-hidden="true" />
            </Button>
          </Popconfirm>
        </div>
      ),
    },
  ];

  return (
    <section className={styles.page}>
      {contextHolder}
      <div className={styles.header} data-stack="h" data-align="start" data-justify="between">
        <div className={styles.titleGroup}>
          <h1>Мои датасеты</h1>
          <p>Управляйте загруженными файлами и открывайте их для подготовки нового анализа.</p>
        </div>
        <Button
          type="primary"
          size="large"
          className={styles.uploadButton}
          onClick={handleOpenUpload}
        >
          + Загрузить новый файл
        </Button>
      </div>

      {error ? (
        <Alert
          showIcon
          type="warning"
          message="Не удалось загрузить список датасетов"
          description={getApiErrorMessage(error, 'Проверьте авторизацию и доступность backend.')}
          action={<Button onClick={() => window.location.reload()}>Обновить</Button>}
        />
      ) : (
        <div className={styles.tablePanel}>
          <Table<IDatasetListItem>
            rowKey="id"
            loading={isLoading || isFetching}
            columns={columns}
            dataSource={visibleDatasets}
            pagination={false}
            locale={{
              emptyText: (
                <Empty
                  image={Empty.PRESENTED_IMAGE_SIMPLE}
                  description="Пока нет загруженных датасетов"
                >
                  <Button type="primary" onClick={handleOpenUpload}>
                    Загрузить первый файл
                  </Button>
                </Empty>
              ),
            }}
          />
          <div
            className={styles.tableFooter}
            data-stack="h"
            data-align="center"
            data-justify="between"
          >
            <span>
              Показано {visibleDatasets.length} из {datasets.length} датасетов
            </span>
            <div className={styles.pagination} data-stack="h" data-align="center">
              <Button disabled={page === 1} onClick={() => setPage((current) => current - 1)}>
                ←
              </Button>
              <Button
                disabled={page * PAGE_SIZE >= datasets.length}
                onClick={() => setPage((current) => current + 1)}
              >
                →
              </Button>
            </div>
          </div>
        </div>
      )}

      <div className={styles.pipelinePanel}>
        <div>
          <h2>Конвейер аналитики</h2>
          <p>
            Файл сохраняется как черновик. На странице нового анализа можно уточнить маппинг,
            отредактировать данные и затем запустить расчет метрик.
          </p>
        </div>
        <div className={styles.stats} data-stack="h" data-align="center">
          <div>
            <strong>30</strong>
            <span>строк превью</span>
          </div>
          <div>
            <strong>1</strong>
            <span>активная версия</span>
          </div>
        </div>
      </div>

      <Modal
        title="Загрузить новый файл"
        open={isUploadOpen}
        onCancel={() => {
          setIsUploadOpen(false);
          setSelectedFile(null);
        }}
        onOk={handleUpload}
        okText="Загрузить"
        cancelText="Отмена"
        confirmLoading={isUploading}
        okButtonProps={{ disabled: !selectedFile }}
      >
        <Upload.Dragger
          accept=".csv,.xlsx,.xls"
          beforeUpload={(file) => {
            setSelectedFile(file);
            return false;
          }}
          maxCount={1}
          onRemove={() => {
            setSelectedFile(null);
          }}
        >
          <div className={styles.dropZone}>
            <span className={styles.dropIcon}>↥</span>
            <p>Перетащите Excel или CSV файл</p>
            <span>Поддерживаемые форматы: .xlsx, .xls, .csv</span>
          </div>
        </Upload.Dragger>
        <Alert
          className={styles.mappingHint}
          showIcon
          type="info"
          message="Маппинг заголовков можно уточнить после открытия датасета на странице нового анализа."
        />
      </Modal>
    </section>
  );
}
