import { Card, Space, Typography } from 'antd';

import { NewAnalyticsDemo } from '@/features/new-analytics-demo';
import { SessionDemo } from '@/features/session-demo';

import styles from './StateWorkbench.module.scss';

const stateLayers = [
  'shared/api/baseApi вЂ” РµРґРёРЅР°СЏ RTK Query Р±Р°Р·Р° СЃ credentials Рё tag types',
  'entities/session/api вЂ” РєРѕРЅС‚СЂР°РєС‚ РїРѕРґ auth Рё guest demo СЂРµР¶РёРј',
  'entities/dataset/api вЂ” preview Рё СЃРѕС…СЂР°РЅРµРЅРёРµ С‡РµСЂРЅРѕРІРёРєР° РґР°С‚Р°СЃРµС‚Р°',
  'entities/analysis/api вЂ” СЃРїРёСЃРѕРє Р°РЅР°Р»РёР·РѕРІ, РґРµС‚Р°Р»Рё Рё Р·Р°РїСѓСЃРє Р°РЅР°Р»РёР·Р°',
  'features/new-analytics/model вЂ” Р»РѕРєР°Р»СЊРЅС‹Р№ РіР»РѕР±Р°Р»СЊРЅС‹Р№ draft upload flow',
  'app/providers/store-provider вЂ” СЃР±РѕСЂРєР° store, middleware Рё typed hooks',
];

export function StateWorkbench() {
  return (
    <div className={styles.grid}>
      <SessionDemo />
      <NewAnalyticsDemo />

      <Card className={styles.fullWidth} title="РљР°Рє СѓСЃС‚СЂРѕРµРЅРѕ СЃРѕСЃС‚РѕСЏРЅРёРµ">
        <Space orientation="vertical" size="middle">
          <Typography.Paragraph>
            Р­С‚Рѕ СЃС‚Р°СЂС‚РѕРІС‹Р№ РєР°СЂРєР°СЃ С„СЂРѕРЅС‚РµРЅРґ-СЃРѕСЃС‚РѕСЏРЅРёСЏ РїРѕРґ РІР°С€
            MVP: СЃРµСЃСЃРёСЏ РїРѕР»СЊР·РѕРІР°С‚РµР»СЏ, upload flow РЅРѕРІРѕР№ Р°РЅР°Р»РёС‚РёРєРё Рё
            RTK Query-СЃР»РѕР№ РїРѕРґ backend.
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
