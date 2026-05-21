import type { MenuProps } from 'antd';
import { Layout, Menu } from 'antd';
import type { PropsWithChildren } from 'react';

import styles from './ShellLayout.module.scss';

const menuItems: MenuProps['items'] = [
  { key: 'new-analysis', label: 'РќРѕРІР°СЏ Р°РЅР°Р»РёС‚РёРєР°' },
  { key: 'datasets', label: 'РњРѕРё РґР°С‚Р°СЃРµС‚С‹' },
  { key: 'state', label: 'РљР°СЂРєР°СЃ СЃРѕСЃС‚РѕСЏРЅРёСЏ' },
];

export function ShellLayout({ children }: PropsWithChildren) {
  return (
    <Layout className={styles.layout}>
      <Layout.Sider width={280} className={styles.sider}>
        <div className={styles.brand}>
          <span className={styles.brandTitle}>BusinessPulse</span>
          <span className={styles.brandCaption}>
            РЎРїРѕРєРѕР№РЅР°СЏ BI-РїР»Р°С‚С„РѕСЂРјР° РґР»СЏ РјР°Р»РѕРіРѕ Р±РёР·РЅРµСЃР°
          </span>
        </div>

        <Menu theme="dark" mode="inline" selectedKeys={['state']} items={menuItems} />
      </Layout.Sider>

      <Layout.Content className={styles.content}>
        <div className={styles.contentInner}>{children}</div>
      </Layout.Content>
    </Layout>
  );
}
