import { Button } from 'antd';
import { useNavigate } from 'react-router-dom';

import aiRecommendationsIcon from '@/app/assets/home-section/ai-recommendations.svg';
import executiveReportIcon from '@/app/assets/home-section/executive-report.svg';
import heroChartImage from '@/app/assets/home-section/hero-chart.png';
import heroDashboardImage from '@/app/assets/home-section/hero-dashboard.png';
import heroRingImage from '@/app/assets/home-section/hero-ring.png';
import loadIcon from '@/app/assets/home-section/load.svg';
import processingIcon from '@/app/assets/home-section/processing.svg';
import visualizationIcon from '@/app/assets/home-section/visualization.svg';

import { HomeCta } from '../HomeCta';
import styles from './HomePage.module.scss';

const steps = [
  {
    icon: loadIcon,
    title: 'Загрузите файл',
    text: 'Добавьте Excel или CSV с расходами, лидами, заказами и выручкой. Сервис покажет первые строки для быстрой проверки.',
  },
  {
    icon: processingIcon,
    title: 'Обработка',
    text: 'Сопоставьте нужные колонки, поправьте значения и запустите один понятный анализ по загруженному датасету.',
  },
  {
    icon: visualizationIcon,
    title: 'Визуализация',
    text: 'Получите аккуратные графики по каналам, динамике продаж, расходам и ключевым маркетинговым метрикам.',
  },
  {
    icon: aiRecommendationsIcon,
    title: 'AI-рекомендации',
    text: 'Ассистент кратко объяснит выводы, подсветит риски и предложит следующие шаги в рамках текущего анализа.',
  },
];

const benefits = [
  {
    tone: 'blue',
    title: 'Простота',
    text: 'Создано для людей, а не для дата-сайентистов. Нулевой порог входа.',
  },
  {
    title: 'Скорость',
    text: 'От сырого файла до профессионального дашборда меньше чем за полминуты.',
  },
  {
    title: 'Низкая стоимость',
    text: 'Дешевле найма консультанта или лицензии на корпоративный BI.',
  },
  {
    title: 'Без аналитиков',
    text: 'AI сам находит связи в данных, сравнивает каналы и помогает заметить тренды.',
  },
  {
    title: 'Понятный язык',
    text: 'Инсайты на русском языке, без технического жаргона и SQL-запросов.',
  },
  {
    tone: 'green',
    title: 'На основе данных',
    text: 'Хватит гадать. Основывайте следующие шаги бизнеса на фактах и числах.',
  },
];

const kpis = [
  { label: 'REVENUE', value: '$42,900', delta: '+12.5% vs LW' },
  { label: 'AOV', value: '$124.50', delta: '+2.1%' },
  { label: 'CHURN', value: '4.2%', delta: '-0.4%', danger: true },
];

const swot = ['S: Retention', 'W: Latency', 'O: Markets', 'T: Competitors'];

export function HomePage() {
  const navigate = useNavigate();

  return (
    <div className={styles.page}>
      <section className={styles.hero}>
        <div className={styles.heroContent}>
          <p className={styles.eyebrow}>BusinessPulse</p>
          <h1 className={styles.title}>Аналитика для малого бизнеса за 30 секунд</h1>
          <p className={styles.lead}>
            Загрузите таблицу с рекламой и продажами, проверьте колонки и получите понятный отчет по
            маркетингу без сложной настройки.
          </p>

          <div className={styles.heroActions} data-stack="h" data-gap="12" data-wrap="wrap">
            <Button type="primary" size="large" onClick={() => navigate('/sign-up')}>
              Зарегистрировать мой бизнес
            </Button>
            <Button size="large" onClick={() => navigate('/how-it-works')}>
              Как это работает
            </Button>
          </div>
        </div>

        <div className={styles.heroVisual} aria-hidden="true">
          <img className={styles.dashboard} src={heroDashboardImage} alt="" />
          <img className={styles.chart} src={heroChartImage} alt="" />
          <img className={styles.ring} src={heroRingImage} alt="" />
        </div>
      </section>

      <section className={styles.section}>
        <div className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}>Как это работает</h2>
          <p className={styles.sectionText}>
            От файла к понятной картине бизнеса: загрузка, обработка, визуализация и рекомендации в
            одном спокойном сценарии.
          </p>
        </div>

        <div className={styles.steps}>
          {steps.map((step) => (
            <article key={step.title} className={styles.step}>
              <div className={styles.iconBox}>
                <img className={styles.icon} src={step.icon} alt="" aria-hidden="true" />
              </div>
              <h3 className={styles.cardTitle}>{step.title}</h3>
              <p className={styles.cardText}>{step.text}</p>
            </article>
          ))}
        </div>
      </section>

      <section className={styles.benefitsSection}>
        <div className={styles.centerHeader}>
          <h2 className={styles.sectionTitle}>Ключевые преимущества</h2>
          <p className={styles.sectionText}>
            Почему малому бизнесу проще работать с BusinessPulse вместо сложных устаревших
            инструментов.
          </p>
        </div>

        <div className={styles.benefits}>
          {benefits.map((benefit) => (
            <article
              key={benefit.title}
              className={`${styles.benefit} ${benefit.tone ? styles[benefit.tone] : ''}`}
            >
              <h3>{benefit.title}</h3>
              <p>{benefit.text}</p>
            </article>
          ))}
        </div>
      </section>

      <section className={styles.reportSection} aria-label="Сводка для руководителя">
        <div className={styles.reportText}>
          Мы превращаем сырые строки в курируемую сводку для руководства. Каждый дашборд включает
          автоматический SWOT и отслеживание ключевых показателей.
        </div>

        <div className={styles.reportPreview}>
          <div
            className={styles.reportHeader}
            data-stack="h"
            data-align="center"
            data-justify="between"
          >
            <div data-stack="h" data-align="center" data-gap="10">
              <span className={styles.reportIcon}>
                <img src={executiveReportIcon} alt="" aria-hidden="true" />
              </span>
              <strong>Executive Report</strong>
            </div>
            <span>Last updated: just now</span>
          </div>

          <div className={styles.kpiGrid}>
            {kpis.map((kpi) => (
              <div key={kpi.label} className={styles.kpiCard}>
                <small>{kpi.label}</small>
                <strong>{kpi.value}</strong>
                <span className={kpi.danger ? styles.negative : styles.positive}>{kpi.delta}</span>
              </div>
            ))}
          </div>

          <div className={styles.reportMedia}>
            <img className={styles.reportChart} src={heroChartImage} alt="" aria-hidden="true" />
            <img className={styles.reportRing} src={heroRingImage} alt="" aria-hidden="true" />
          </div>

          <div className={styles.reportBottom}>
            <div className={styles.recommendations}>
              <h3>AI RECOMMENDATIONS</h3>
              <p>Increase marketing spend in Q4.</p>
              <p>Re-engage inactive users with 10% discount.</p>
              <p>Optimize inventory for high-margin items.</p>
            </div>

            <div className={styles.swot}>
              <h3>SWOT SUMMARY</h3>
              <div className={styles.swotGrid}>
                {swot.map((item) => (
                  <span key={item}>{item}</span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <HomeCta />
    </div>
  );
}
