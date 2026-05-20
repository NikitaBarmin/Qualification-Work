import { Button, Card, Descriptions, Space, Tag } from 'antd';

import {
  clearSession,
  setAuthenticatedSession,
  startGuestSession,
} from '@/entities/session/model/slice/sessionSlice';
import { useAppDispatch, useAppSelector } from '@/shared/lib/store/hooks';

export function SessionDemo() {
  const dispatch = useAppDispatch();
  const session = useAppSelector((state) => state.session);

  return (
    <Card
      title="Сессия"
      extra={<Tag color="blue">{session.status}</Tag>}
    >
      <Descriptions
        column={1}
        size="small"
      >
        <Descriptions.Item label="Инициализирована">
          {session.initialized ? 'Да' : 'Нет'}
        </Descriptions.Item>
        <Descriptions.Item label="Пользователь">
          {session.user?.email ?? 'Нет данных'}
        </Descriptions.Item>
        <Descriptions.Item label="Тип бизнеса">
          {session.user?.businessType ?? 'Не указан'}
        </Descriptions.Item>
      </Descriptions>

      <Space wrap>
        <Button onClick={() => dispatch(startGuestSession())}>
          Включить демо-гостя
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
          Смоделировать вход
        </Button>
        <Button
          danger
          onClick={() => dispatch(clearSession())}
        >
          Сбросить
        </Button>
      </Space>
    </Card>
  );
}
