import { Card, Space, Typography } from 'antd';

import { NewAnalyticsDemo } from '@/features/new-analytics-demo/ui/NewAnalyticsDemo';
import { SessionDemo } from '@/features/session-demo/ui/SessionDemo';

import styles from './StateWorkbench.module.scss';

const stateLayers = [
  'shared/api/baseApi — единая RTK Query база с credentials и tag types',
  'entities/session/api — контракт под auth и guest demo режим',
  'entities/dataset/api — preview и сохранение черновика датасета',
  'entities/analysis/api — список анализов, детали и запуск анализа',
  'features/new-analytics/model — локальный глобальный draft upload flow',
  'app/providers/store-provider — сборка store, middleware и typed hooks',
];

export function StateWorkbench() {
  return (
    <div className={styles.grid}>
      <SessionDemo />
      <NewAnalyticsDemo />

      <Card className={styles.fullWidth} title="Как устроено состояние">
        <Space orientation="vertical" size="middle">
          <Typography.Paragraph>
            Это стартовый каркас фронтенд-состояния под ваш MVP: сессия пользователя, upload flow
            новой аналитики и RTK Query-слой под backend.
          </Typography.Paragraph>
          <Space orientation="vertical" size="small">
            {stateLayers.map((item) => (
              <Card key={item} size="small">
                {item}
              </Card>
            ))}
          </Space>
        </Space>
      </Card>
    </div>
  );
}
