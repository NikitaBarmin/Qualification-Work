import { Button, Card, Descriptions, Space, Tag } from 'antd';

import { clearSession, setAuthenticatedSession, startGuestSession } from '@/entities/session';
import { useAppDispatch, useAppSelector } from '@/shared/lib/store';

export function SessionDemo() {
  const dispatch = useAppDispatch();
  const session = useAppSelector((state) => state.session);

  return (
    <Card title="РЎРµСЃСЃРёСЏ" extra={<Tag color="blue">{session.status}</Tag>}>
      <Descriptions column={1} size="small">
        <Descriptions.Item label="РРЅРёС†РёР°Р»РёР·РёСЂРѕРІР°РЅР°">
          {session.initialized ? 'Р”Р°' : 'РќРµС‚'}
        </Descriptions.Item>
        <Descriptions.Item label="РџРѕР»СЊР·РѕРІР°С‚РµР»СЊ">
          {session.user?.email ?? 'РќРµС‚ РґР°РЅРЅС‹С…'}
        </Descriptions.Item>
        <Descriptions.Item label="РўРёРї Р±РёР·РЅРµСЃР°">
          {session.user?.businessType ?? 'РќРµ СѓРєР°Р·Р°РЅ'}
        </Descriptions.Item>
      </Descriptions>

      <Space wrap>
        <Button onClick={() => dispatch(startGuestSession())}>
          Р’РєР»СЋС‡РёС‚СЊ РґРµРјРѕ-РіРѕСЃС‚СЏ
        </Button>
        <Button
          type="primary"
          onClick={() =>
            dispatch(
              setAuthenticatedSession({
                id: 'user-1',
                email: 'owner@businesspulse.ru',
                businessType: 'retail',
              }),
            )
          }
        >
          РЎРјРѕРґРµР»РёСЂРѕРІР°С‚СЊ РІС…РѕРґ
        </Button>
        <Button danger onClick={() => dispatch(clearSession())}>
          РЎР±СЂРѕСЃРёС‚СЊ
        </Button>
      </Space>
    </Card>
  );
}
