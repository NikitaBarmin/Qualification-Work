import { Button, Card, Descriptions, Flex, Space, Tag } from 'antd';

import {
  hydrateDemoDraft,
  markTableChanged,
  resetNewAnalyticsDraft,
  setLaunchStatus,
  setNewAnalyticsStep,
} from '@/features/new-analytics/model/slice/newAnalyticsSlice';
import { useAppDispatch, useAppSelector } from '@/shared/lib/store/hooks';

export function NewAnalyticsDemo() {
  const dispatch = useAppDispatch();
  const draft = useAppSelector((state) => state.newAnalytics);

  return (
    <Card title="Черновик новой аналитики" extra={<Tag color="geekblue">{draft.step}</Tag>}>
      <Descriptions column={1} size="small">
        <Descriptions.Item label="Файл">
          {draft.selectedFileName ?? 'Файл ещё не выбран'}
        </Descriptions.Item>
        <Descriptions.Item label="Статус запуска">{draft.launchStatus}</Descriptions.Item>
        <Descriptions.Item label="Есть ручные правки">
          {draft.hasTableChanges ? 'Да' : 'Нет'}
        </Descriptions.Item>
      </Descriptions>

      <Space wrap>
        <Button type="primary" onClick={() => dispatch(hydrateDemoDraft())}>
          Заполнить демо-черновик
        </Button>
        <Button onClick={() => dispatch(setNewAnalyticsStep('editing'))}>
          Перейти к редактированию
        </Button>
        <Button onClick={() => dispatch(markTableChanged(true))}>Отметить правки</Button>
        <Button onClick={() => dispatch(setLaunchStatus('processing'))}>
          Смоделировать запуск
        </Button>
        <Button danger onClick={() => dispatch(resetNewAnalyticsDraft())}>
          Очистить
        </Button>
      </Space>

      <Flex vertical gap={16} style={{ marginTop: 20 }}>
        <Card size="small" title="Колонки превью">
          <Space orientation="vertical" size="small">
            {draft.previewHeaders.length === 0
              ? 'Пока нет данных превью'
              : draft.previewHeaders.map((item) => <span key={item}>{item}</span>)}
          </Space>
        </Card>

        <Card size="small" title="Текущий mapping">
          <Space orientation="vertical" size="small">
            {Object.entries(draft.mapping).map(([field, column]) => (
              <span key={field}>
                <strong>{field}</strong>: {column ?? 'не сопоставлено'}
              </span>
            ))}
          </Space>
        </Card>
      </Flex>
    </Card>
  );
}
