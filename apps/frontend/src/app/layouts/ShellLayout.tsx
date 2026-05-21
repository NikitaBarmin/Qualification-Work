import type { MenuProps } from 'antd';
import { Layout, Menu } from 'antd';
import type { PropsWithChildren } from 'react';

import styles from './ShellLayout.module.scss';

const menuItems: MenuProps['items'] = [
  { key: 'new-analysis', label: 'Новая аналитика' },
  { key: 'datasets', label: 'Мои датасеты' },
  { key: 'state', label: 'Каркас состояния' },
];

export function ShellLayout({ children }: PropsWithChildren) {
  return (
    <Layout className={styles.layout}>
      <Layout.Sider width={280} className={styles.sider}>
        <div className={styles.brand}>
          <span className={styles.brandTitle}>BusinessPulse</span>
          <span className={styles.brandCaption}>Спокойная BI-платформа для малого бизнеса</span>
        </div>

        <Menu theme="dark" mode="inline" selectedKeys={['state']} items={menuItems} />
      </Layout.Sider>

      <Layout.Content className={styles.content}>
        <div className={styles.contentInner}>{children}</div>
      </Layout.Content>
    </Layout>
  );
}
