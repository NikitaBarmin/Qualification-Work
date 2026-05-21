import { Button, Card, Descriptions, Flex, Space, Tag } from 'antd';

import {
  hydrateDemoDraft,
  markTableChanged,
  resetNewAnalyticsDraft,
  setLaunchStatus,
  setNewAnalyticsStep,
} from '@/features/new-analytics';
import { useAppDispatch, useAppSelector } from '@/shared/lib/store';

export function NewAnalyticsDemo() {
  const dispatch = useAppDispatch();
  const draft = useAppSelector((state) => state.newAnalytics);

  return (
    <Card
      title="Р§РµСЂРЅРѕРІРёРє РЅРѕРІРѕР№ Р°РЅР°Р»РёС‚РёРєРё"
      extra={<Tag color="geekblue">{draft.step}</Tag>}
    >
      <Descriptions column={1} size="small">
        <Descriptions.Item label="Р¤Р°Р№Р»">
          {draft.selectedFileName ?? 'Р¤Р°Р№Р» РµС‰С‘ РЅРµ РІС‹Р±СЂР°РЅ'}
        </Descriptions.Item>
        <Descriptions.Item label="РЎС‚Р°С‚СѓСЃ Р·Р°РїСѓСЃРєР°">
          {draft.launchStatus}
        </Descriptions.Item>
        <Descriptions.Item label="Р•СЃС‚СЊ СЂСѓС‡РЅС‹Рµ РїСЂР°РІРєРё">
          {draft.hasTableChanges ? 'Р”Р°' : 'РќРµС‚'}
        </Descriptions.Item>
      </Descriptions>

      <Space wrap>
        <Button type="primary" onClick={() => dispatch(hydrateDemoDraft())}>
          Р—Р°РїРѕР»РЅРёС‚СЊ РґРµРјРѕ-С‡РµСЂРЅРѕРІРёРє
        </Button>
        <Button onClick={() => dispatch(setNewAnalyticsStep('editing'))}>
          РџРµСЂРµР№С‚Рё Рє СЂРµРґР°РєС‚РёСЂРѕРІР°РЅРёСЋ
        </Button>
        <Button onClick={() => dispatch(markTableChanged(true))}>
          РћС‚РјРµС‚РёС‚СЊ РїСЂР°РІРєРё
        </Button>
        <Button onClick={() => dispatch(setLaunchStatus('processing'))}>
          РЎРјРѕРґРµР»РёСЂРѕРІР°С‚СЊ Р·Р°РїСѓСЃРє
        </Button>
        <Button danger onClick={() => dispatch(resetNewAnalyticsDraft())}>
          РћС‡РёСЃС‚РёС‚СЊ
        </Button>
      </Space>

      <Flex vertical gap={16} style={{ marginTop: 20 }}>
        <Card size="small" title="РљРѕР»РѕРЅРєРё РїСЂРµРІСЊСЋ">
          <Space orientation="vertical" size="small">
            {draft.previewHeaders.length === 0
              ? 'РџРѕРєР° РЅРµС‚ РґР°РЅРЅС‹С… РїСЂРµРІСЊСЋ'
              : draft.previewHeaders.map((item) => <span key={item}>{item}</span>)}
          </Space>
        </Card>

        <Card size="small" title="РўРµРєСѓС‰РёР№ mapping">
          <Space orientation="vertical" size="small">
            {Object.entries(draft.mapping).map(([field, column]) => (
              <span key={field}>
                <strong>{field}</strong>: {column ?? 'РЅРµ СЃРѕРїРѕСЃС‚Р°РІР»РµРЅРѕ'}
              </span>
            ))}
          </Space>
        </Card>
      </Flex>
    </Card>
  );
}
