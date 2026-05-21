import { Space, Typography } from 'antd';

import { StateWorkbench } from '@/widgets/state-workbench';

export function HomePage() {
  return (
    <Space orientation="vertical" size="large" style={{ width: '100%' }}>
      <div>
        <Typography.Title level={1}>РљР°СЂРєР°СЃ frontend-СЃРѕСЃС‚РѕСЏРЅРёСЏ</Typography.Title>
        <Typography.Paragraph type="secondary">
          Р—РґРµСЃСЊ РјС‹ Р·Р°РєР»Р°РґС‹РІР°РµРј СЏРґСЂРѕ РїРѕРґ Р°РІС‚РѕСЂРёР·Р°С†РёСЋ,
          РґРµРјРѕ-СЂРµР¶РёРј, РЅРѕРІСѓСЋ Р°РЅР°Р»РёС‚РёРєСѓ, СЃРїРёСЃРѕРє Р°РЅР°Р»РёР·РѕРІ Рё
          РґР°Р»СЊРЅРµР№С€СѓСЋ СЂР°Р±РѕС‚Сѓ СЃ backend С‡РµСЂРµР· RTK Query.
        </Typography.Paragraph>
      </div>

      <StateWorkbench />
    </Space>
  );
}
