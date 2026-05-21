import { Space, Typography } from 'antd';

import { StateWorkbench } from '@/widgets/state-workbench/ui/StateWorkbench';

export function HomePage() {
  return (
    <Space orientation="vertical" size="large" style={{ width: '100%' }}>
      <div>
        <Typography.Title level={1}>Каркас frontend-состояния</Typography.Title>
        <Typography.Paragraph type="secondary">
          Здесь мы закладываем ядро под авторизацию, демо-режим, новую аналитику, список анализов и
          дальнейшую работу с backend через RTK Query.
        </Typography.Paragraph>
      </div>

      <StateWorkbench />
    </Space>
  );
}
