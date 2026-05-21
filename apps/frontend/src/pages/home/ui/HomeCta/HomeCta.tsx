import { Button } from 'antd';
import { useNavigate } from 'react-router-dom';

import styles from './HomeCta.module.scss';

export function HomeCta() {
  const navigate = useNavigate();

  return (
    <section className={styles.section}>
      <h2 className={styles.title}>Готовы начать использовать данные?</h2>
      <p className={styles.text}>
        Присоединяйтесь к малым предприятиям, которые принимают более умные решения каждый день. Для
        начала пластиковая карта не требуется.
      </p>

      <Button
        className={styles.button}
        type="primary"
        size="large"
        onClick={() => navigate('/sign-up')}
      >
        Зарегистрировать мой бизнес
      </Button>

      <p className={styles.note}>
        Бесплатный тариф доступен навсегда. Для профессионалов — расширенные отчеты.
      </p>
    </section>
  );
}
