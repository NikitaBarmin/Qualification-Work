import { Button, Modal } from 'antd';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

import automaticCleanIcon from '@/app/assets/how-is-it-work-section/automatic-clean.svg';
import visualEffectivenessImage from '@/app/assets/how-is-it-work-section/visual-effectivness.png';
import visualFractionImage from '@/app/assets/how-is-it-work-section/visual-fraction.png';
import visualRevenueImage from '@/app/assets/how-is-it-work-section/visual-revenue.png';
import visualSwotAiImage from '@/app/assets/how-is-it-work-section/visual-swot-ai.png';

import styles from './HowItWorksPage.module.scss';

const metrics = [
  { label: 'ARR GROWTH', value: '$2.4M', delta: '+ 14%' },
  { label: 'LTV:CAC RATIO', value: '4.2x', delta: '+ 0.6' },
  { label: 'CHURN RATE', value: '1.8%', delta: '- 0.2%' },
  { label: 'NET RETENTION', value: '112%', delta: '+ 2.1%' },
  { label: 'ACTIVE USERS', value: '14.8k', delta: '+ 800' },
  { label: 'AVG. MARGIN', value: '68%', delta: '+ 3%' },
  { label: 'NPS SCORE', value: '72', delta: 'Stable' },
  { label: 'PAYBACK PERIOD', value: '5.2m', delta: '- 0.8m' },
];

const cleanSteps = [
  'Удаление дублирующих записей',
  'Стандартизация валютных форматов',
  'Структурирование временных рядов',
];

export function HowItWorksPage() {
  const navigate = useNavigate();
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <div className={styles.page}>
      <section className={styles.hero}>
        <p className={styles.eyebrow}>ЦИФРОВОЙ ОПЫТ</p>
        <h1>
          Посмотрите, как за 30 секунд ваш бизнес превращается в <span>прозрачную аналитику</span>
        </h1>
        <p>
          Познакомьтесь с переходом от сырых, сложных данных к курируемым управленческим инсайтам с
          помощью нашего собственного аналитического движка.
        </p>
      </section>

      <section className={styles.connectionCard}>
        <div className={styles.cardText}>
          <span className={styles.stepBadge}>1</span>
          <h2>Простое подключение данных</h2>
          <p>
            Перетащите ваши «грязные» CSV, выгрузки из SQL или подключитесь напрямую через API. Наша
            система мгновенно распознает структуру схемы данных.
          </p>
        </div>

        <div className={styles.uploadMock} aria-hidden="true">
          <div className={styles.dropZone}>
            <span className={styles.cloudIcon}>UPLOAD</span>
            <strong>revenue_q3_final.csv</strong>
            <i />
          </div>
        </div>
      </section>

      <section className={styles.etlCard}>
        <div className={styles.etlMock} aria-hidden="true">
          <div
            className={styles.etlHeader}
            data-stack="h"
            data-align="center"
            data-justify="between"
          >
            <strong>СТАТУС ETL-КОНВЕЙЕРА</strong>
            <span>CLEANING DATA</span>
          </div>
          <ul>
            {cleanSteps.map((step, index) => (
              <li key={step}>
                <img src={automaticCleanIcon} alt="" aria-hidden="true" />
                <span>{step}</span>
                {index === cleanSteps.length - 1 && <b />}
              </li>
            ))}
          </ul>
        </div>

        <div className={styles.cardText}>
          <span className={styles.stepBadge}>2</span>
          <h2>Статус ETL-конвейера</h2>
          <p>
            Автономный ETL-интеллект — наш AI-управляемый конвейер автоматически очищает и
            структурирует ваши данные. Никакой ручной очистки или форматирования.
          </p>
        </div>
      </section>

      <section className={styles.metricsSection}>
        <span className={styles.stepBadge}>3</span>
        <h2>Ключевые метрики</h2>

        <div className={styles.metricsGrid}>
          {metrics.map((metric, index) => (
            <article
              key={metric.label}
              className={`${styles.metricCard} ${index === 1 ? styles.metricAccent : ''}`}
            >
              <small>{metric.label}</small>
              <strong>{metric.value}</strong>
              <span>{metric.delta}</span>
            </article>
          ))}
        </div>
      </section>

      <section className={styles.visualSection}>
        <div className={styles.visualIntro}>
          <span className={styles.stepBadge}>4</span>
          <h2>Визуал</h2>
          <p>
            Данные преобразуются в высококонтрастные редакционные графики, которые показывают
            тренды, а не просто числа.
          </p>
        </div>

        <div className={styles.visualGrid}>
          <img
            className={styles.revenueImage}
            src={visualRevenueImage}
            alt="График роста выручки за 12 месяцев"
          />
          <img src={visualFractionImage} alt="Доля рынка" />
          <img src={visualEffectivenessImage} alt="Эффективность каналов" />
        </div>
      </section>

      <section className={styles.aiSection}>
        <img src={visualSwotAiImage} alt="AI-анализ и SWOT с рекомендациями" />
      </section>

      <section className={styles.ctaSection}>
        <h2>Хотите то же самое для вашего бизнеса?</h2>
        <div
          className={styles.ctaActions}
          data-stack="h"
          data-gap="12"
          data-wrap="wrap"
          data-justify="center"
        >
          <Button type="primary" size="large" onClick={() => navigate('/sign-up')}>
            Начать бесплатно
          </Button>
          <Button size="large" onClick={() => setIsModalOpen(true)}>
            Поговорить с аналитиком
          </Button>
        </div>
      </section>

      <Modal
        centered
        footer={null}
        open={isModalOpen}
        title="Связь с аналитиком"
        onCancel={() => setIsModalOpen(false)}
      >
        <p className={styles.modalText}>
          Позвоните нам, и мы поможем подготовить данные для первого анализа.
        </p>
        <div className={styles.phone}>+7 999 123-45-67</div>
      </Modal>
    </div>
  );
}
