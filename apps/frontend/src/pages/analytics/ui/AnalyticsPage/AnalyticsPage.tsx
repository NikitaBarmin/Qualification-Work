import { Alert, Button, Empty, message, Progress, Spin, Tag } from 'antd';
import { useRef, useState } from 'react';
import { Navigate, useNavigate, useParams } from 'react-router-dom';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

import keyArrowDownIcon from '@/app/assets/analytics-section/key-arrow-down.svg';
import keyArrowUpIcon from '@/app/assets/analytics-section/key-arrow-up.svg';
import opportunitiesIcon from '@/app/assets/analytics-section/opportunities.svg';
import strengthIcon from '@/app/assets/analytics-section/strength.svg';
import threatIcon from '@/app/assets/analytics-section/threat.svg';
import weaknessesIcon from '@/app/assets/analytics-section/weaknesses.svg';
import { useGetAnalysesListQuery, useGetAnalysisByIdQuery } from '@/entities/analysis';
import type {
  IAnalysisAggregate,
  IAnalysisChannelPoint,
  IAnalysisDatePoint,
  IAnalysisRecommendation,
  ISwotResults,
} from '@/entities/analysis/model/types/analysis';
import { getApiErrorMessage } from '@/shared/api';

import styles from './AnalyticsPage.module.scss';

const KPI_ITEMS: Array<{
  key: keyof IAnalysisAggregate;
  label: string;
  suffix?: string;
  money?: boolean;
}> = [
  { key: 'revenue', label: 'Выручка', money: true },
  { key: 'spend', label: 'Расходы', money: true },
  { key: 'roas', label: 'ROAS', suffix: 'x' },
  { key: 'cac', label: 'CAC', money: true },
  { key: 'aov', label: 'AOV', money: true },
  { key: 'conversionRate', label: 'Конверсия', suffix: '%' },
  { key: 'repeatOrderShare', label: 'Повторные заказы', suffix: '%' },
  { key: 'profitProxy', label: 'Profit proxy', money: true },
];

const SWOT_VIEW = [
  { key: 'strengths', title: 'Сильные стороны', icon: strengthIcon },
  { key: 'weaknesses', title: 'Слабые стороны', icon: weaknessesIcon },
  { key: 'opportunities', title: 'Возможности', icon: opportunitiesIcon },
  { key: 'threats', title: 'Риски', icon: threatIcon },
] as const;

const CHANNEL_COLORS = [
  '#415aab',
  '#2d7a4d',
  '#94a3d8',
  '#77aa8a',
  '#d0d4dc',
  '#6f7d8f',
  '#a8b6b0',
  '#c0c6d2',
];

const SEVERITY_COLOR: Record<IAnalysisRecommendation['severity'], string> = {
  high: 'red',
  low: 'green',
  medium: 'gold',
};

const SEVERITY_LABEL: Record<IAnalysisRecommendation['severity'], string> = {
  high: 'Высокий',
  low: 'Низкий',
  medium: 'Средний',
};

const CATEGORY_LABEL: Record<IAnalysisRecommendation['category'], string> = {
  data_quality: 'Качество данных',
  efficiency: 'Эффективность',
  growth: 'Рост',
  retention: 'Удержание',
  risk: 'Риски',
};

function formatNumber(value: number) {
  return new Intl.NumberFormat('ru-RU', {
    maximumFractionDigits: 2,
  }).format(value);
}

function formatMoney(value: number) {
  return new Intl.NumberFormat('ru-RU', {
    currency: 'RUB',
    maximumFractionDigits: 0,
    style: 'currency',
  }).format(value);
}

function formatKpiValue(value: number, item: (typeof KPI_ITEMS)[number]) {
  if (item.money) {
    return formatMoney(value);
  }

  return `${formatNumber(value)}${item.suffix ?? ''}`;
}

function getChannelTableRows(channels: IAnalysisChannelPoint[]) {
  return channels.slice(0, 8);
}

function localizeRecommendationText(value: string) {
  const spendMatch = value.match(/^Review spend efficiency in (.+)$/);
  const scaleMatch = value.match(/^Test budget scaling for (.+)$/);

  if (spendMatch?.[1]) {
    return `Проверьте эффективность расходов в канале ${spendMatch[1]}`;
  }

  if (scaleMatch?.[1]) {
    return `Проверьте масштабирование бюджета в канале ${scaleMatch[1]}`;
  }

  const dictionary: Record<string, string> = {
    'The channel consumes a larger share of spend than it returns in revenue.':
      'Канал забирает большую долю рекламного бюджета, чем возвращает в выручке.',
    'Reduce budget or revise targeting and offer quality for this channel.':
      'Снизьте бюджет или пересмотрите таргетинг, оффер и качество посадочной страницы для этого канала.',
    'The channel has above-average ROAS while not dominating the media budget.':
      'Канал показывает ROAS выше среднего и при этом не занимает чрезмерную долю бюджета.',
    'Run a controlled budget increase and monitor CAC and conversion rate.':
      'Запустите контролируемое увеличение бюджета и отслеживайте CAC, конверсию и итоговый ROAS.',
    'Strengthen repeat purchase mechanics': 'Усилить механику повторных покупок',
    'Returning orders are a small share of total orders.':
      'Повторные заказы занимают небольшую долю от общего количества заказов.',
    'Launch remarketing, loyalty offers, and post-purchase email sequences.':
      'Запустите ремаркетинг, персональные предложения лояльности и post-purchase коммуникации.',
    'Reduce revenue concentration risk': 'Снизить риск концентрации выручки',
    'Revenue is strongly concentrated in one channel.':
      'Выручка слишком сильно зависит от одного канала привлечения.',
    'Diversify acquisition channels and protect the leading channel from volatility.':
      'Диверсифицируйте каналы привлечения и отдельно защитите ведущий канал от просадок.',
    'Investigate anomalous dates': 'Разобрать аномальные даты',
    'The timeline contains unusual revenue or spend movements.':
      'Во временном ряду есть необычные движения выручки или расходов.',
    'Check campaign changes, site availability, stock, and tracking for these dates.':
      'Проверьте изменения в кампаниях, доступность сайта, остатки товаров и корректность трекинга в эти даты.',
    'Improve source data quality': 'Повысить качество исходных данных',
    'Some mapped columns or rows need attention before deeper analysis.':
      'Часть сопоставленных колонок или строк требует проверки перед более глубоким анализом.',
    'Complete mapping and fix invalid values before using the dashboard for decisions.':
      'Дозаполните маппинг и исправьте некорректные значения перед использованием дашборда для решений.',
  };

  return dictionary[value] ?? value;
}

function localizeSwotText(value: string) {
  const roasMatch = value.match(/^Healthy overall ROAS: (.+)\.$/);
  const repeatMatch = value.match(/^Repeat orders contribute (.+)% of total orders\.$/);
  const topChannelMatch = value.match(/^Top revenue channel: (.+)\.$/);
  const conversionMatch = value.match(/^Low conversion rate: (.+)%\.$/);
  const scaleMatch = value.match(/^Scale efficient channel (.+) carefully\.$/);
  const riskMatch = value.match(/^Revenue concentration risk: (.+) generates (.+)% of revenue\.$/);

  if (roasMatch?.[1]) {
    return `Общий ROAS на хорошем уровне: ${roasMatch[1]}.`;
  }

  if (repeatMatch?.[1]) {
    return `Повторные заказы дают ${repeatMatch[1]}% от общего числа заказов.`;
  }

  if (topChannelMatch?.[1]) {
    return `Ведущий канал по выручке: ${topChannelMatch[1]}.`;
  }

  if (conversionMatch?.[1]) {
    return `Низкая конверсия: ${conversionMatch[1]}%.`;
  }

  if (scaleMatch?.[1]) {
    return `Аккуратно масштабировать эффективный канал ${scaleMatch[1]}.`;
  }

  if (riskMatch?.[1] && riskMatch[2]) {
    return `Риск концентрации выручки: канал ${riskMatch[1]} дает ${riskMatch[2]}% выручки.`;
  }

  const dictionary: Record<string, string> = {
    'CAC is high relative to average order value.':
      'CAC выглядит высоким относительно среднего чека.',
    'Retention is weak: returning orders are below 20%.':
      'Удержание слабое: повторные заказы ниже 20%.',
    'Reallocate budget from inefficient channels to stronger performers.':
      'Перераспределить бюджет из слабых каналов в более результативные.',
    'Detected anomalies may indicate tracking, campaign, or operational issues.':
      'Обнаруженные аномалии могут указывать на проблемы трекинга, кампаний или операционных процессов.',
  };

  return dictionary[value] ?? value;
}

function getSwotItems(swot: ISwotResults | null | undefined, key: keyof ISwotResults) {
  const items = swot?.[key] ?? [];

  return items.length > 0 ? items : ['Недостаточно данных'];
}

function calculateRelativeChange(current: number, previous: number) {
  if (!Number.isFinite(current) || !Number.isFinite(previous) || previous === 0) {
    return 0;
  }

  return ((current - previous) / Math.abs(previous)) * 100;
}

function getKpiDelta(key: keyof IAnalysisAggregate, dateSeries: IAnalysisDatePoint[]) {
  if (dateSeries.length < 2) {
    return 0;
  }

  const first = Number(dateSeries[0]?.[key] ?? 0);
  const last = Number(dateSeries.at(-1)?.[key] ?? 0);

  return calculateRelativeChange(last, first);
}

function getSparkValues(key: keyof IAnalysisAggregate, dateSeries: IAnalysisDatePoint[]) {
  const values = dateSeries.slice(-7).map((item) => Number(item[key] ?? 0));
  const maxValue = Math.max(...values, 1);

  return values.length > 0
    ? values.map((value) => Math.max(22, Math.round((value / maxValue) * 100)))
    : [34, 48, 42, 58, 62, 70, 76];
}

function getRecommendationImpact(recommendation: IAnalysisRecommendation) {
  const evidence = recommendation.evidence;

  if (typeof evidence.expectedImpact === 'string' && evidence.expectedImpact.trim()) {
    return evidence.expectedImpact;
  }

  if (recommendation.category === 'growth' && typeof evidence.roas === 'number') {
    return `+${formatNumber(evidence.roas)}x`;
  }

  if (recommendation.category === 'efficiency' && typeof evidence.spendShare === 'number') {
    return `${formatNumber(evidence.spendShare)}%`;
  }

  if (recommendation.category === 'retention' && typeof evidence.repeatOrderShare === 'number') {
    return `${formatNumber(evidence.repeatOrderShare)}%`;
  }

  if (
    recommendation.category === 'risk' &&
    typeof (evidence as { revenueShare?: unknown }).revenueShare === 'number'
  ) {
    return `${formatNumber((evidence as { revenueShare: number }).revenueShare)}%`;
  }

  return recommendation.severity === 'high' ? 'Важно' : 'План';
}

async function downloadDashboardReportPdf(element: HTMLElement, analysisId: string) {
  const [{ default: html2canvas }, { jsPDF }] = await Promise.all([
    import('html2canvas'),
    import('jspdf'),
  ]);
  const canvas = await html2canvas(element, {
    backgroundColor: '#f4f3f3',
    scale: Math.min(2, window.devicePixelRatio || 1.5),
    useCORS: true,
  });
  const pdf = new jsPDF('p', 'mm', 'a4');
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const margin = 8;
  const imageWidth = pageWidth - margin * 2;
  const imageHeight = (canvas.height * imageWidth) / canvas.width;
  const imageData = canvas.toDataURL('image/png');
  let heightLeft = imageHeight;
  let position = margin;

  pdf.addImage(imageData, 'PNG', margin, position, imageWidth, imageHeight);
  heightLeft -= pageHeight - margin * 2;

  while (heightLeft > 0) {
    position = heightLeft - imageHeight + margin;
    pdf.addPage();
    pdf.addImage(imageData, 'PNG', margin, position, imageWidth, imageHeight);
    heightLeft -= pageHeight - margin * 2;
  }

  pdf.save(`businesspulse-dashboard-${analysisId}.pdf`);
}

export function AnalyticsPage() {
  const navigate = useNavigate();
  const { analysisId } = useParams<{ analysisId: string }>();
  const dashboardRef = useRef<HTMLElement>(null);
  const [messageApi, contextHolder] = message.useMessage();
  const [isExporting, setIsExporting] = useState(false);
  const {
    data: analyses = [],
    isFetching: isAnalysesFetching,
    isLoading: isAnalysesLoading,
  } = useGetAnalysesListQuery(undefined, {
    skip: Boolean(analysisId),
  });
  const {
    data: analysis,
    error,
    isFetching,
    isLoading,
  } = useGetAnalysisByIdQuery(analysisId ?? '', {
    skip: !analysisId,
  });

  if (!analysisId) {
    const latestAnalysis = analyses.find(
      (item) => item.status === 'completed' || item.status === 'partial_success',
    );

    if (isAnalysesLoading || isAnalysesFetching) {
      return (
        <div className={styles.centerState}>
          <Spin />
        </div>
      );
    }

    if (latestAnalysis) {
      return <Navigate to={`/analytics/${latestAnalysis.id}`} replace />;
    }

    return (
      <section className={styles.page}>
        {contextHolder}
        <div className={styles.emptyAnalytics}>
          <span>Аналитика</span>
          <h1>Здесь появится ваш финальный дашборд</h1>
          <p>
            После загрузки файла и запуска анализа мы закрепим здесь последний готовый результат:
            KPI, графики, канальную диагностику, рекомендации и SWOT.
          </p>
          <div className={styles.emptyPreview}>
            <div />
            <div />
            <div />
          </div>
          <Button type="primary" size="large" onClick={() => navigate('/analytics/new')}>
            Создать первый анализ
          </Button>
        </div>
      </section>
    );
  }

  if (isLoading || isFetching) {
    return (
      <div className={styles.centerState}>
        <Spin />
      </div>
    );
  }

  if (error || !analysis) {
    return (
      <Alert
        showIcon
        type="warning"
        message="Не удалось открыть аналитику"
        description={getApiErrorMessage(error, 'Попробуйте запустить анализ заново.')}
        action={<Button onClick={() => navigate('/analytics/new')}>Новый анализ</Button>}
      />
    );
  }

  if (analysis.status === 'failed') {
    return (
      <Alert
        showIcon
        type="error"
        message="Анализ завершился с ошибкой"
        description={analysis.errorMessage ?? 'Не удалось построить аналитический snapshot.'}
        action={<Button onClick={() => navigate('/analytics/new')}>Новый анализ</Button>}
      />
    );
  }

  const metrics = analysis.kpiMetrics;
  const dateSeries = analysis.chartsData?.dateSeries ?? [];
  const channelSeries = analysis.chartsData?.channelSeries ?? [];
  const recommendations = analysis.aiRecommendations?.items ?? [];
  const recommendationsSource = analysis.aiRecommendations?.generatedBy ?? 'rule_based_engine_v1';
  const isAiRecommendations = recommendationsSource.startsWith('llm:');
  const dataQuality = analysis.dataQuality;
  const topChannels = getChannelTableRows(channelSeries);
  const acceptanceRate = dataQuality?.totalRows
    ? Math.round((dataQuality.acceptedRows / dataQuality.totalRows) * 100)
    : 0;

  const handleExportPdf = async () => {
    if (!dashboardRef.current) {
      return;
    }

    try {
      setIsExporting(true);
      await downloadDashboardReportPdf(dashboardRef.current, analysis.id);
      messageApi.success('PDF-отчет сформирован');
    } catch {
      messageApi.error('Не удалось сформировать PDF-отчет');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <section ref={dashboardRef} className={styles.page}>
      {contextHolder}
      <div className={styles.header}>
        <div>
          <span>Executive dashboard</span>
          <h1>Аналитика бизнеса</h1>
          <p>
            Snapshot построен на основе загруженного датасета, маппинга, ручных правок и{' '}
            {isAiRecommendations
              ? 'AI-интерпретации диагностического ядра.'
              : 'rule-based диагностического ядра.'}
          </p>
        </div>
        <div className={styles.headerActions} data-html2canvas-ignore="true">
          <Button type="primary" ghost loading={isExporting} onClick={handleExportPdf}>
            Скачать PDF
          </Button>
          <Tag color={analysis.status === 'partial_success' ? 'gold' : 'green'}>
            {analysis.status === 'partial_success' ? 'Частичный результат' : 'Готово'}
          </Tag>
          <Button onClick={() => navigate('/analytics/new')}>Новый анализ</Button>
        </div>
      </div>

      {analysis.status === 'partial_success' && (
        <Alert
          showIcon
          type="warning"
          message="Анализ построен частично"
          description="Некоторые колонки не были сопоставлены или часть строк не прошла проверку качества."
        />
      )}

      <div className={styles.kpiGrid}>
        {metrics ? (
          KPI_ITEMS.map((item, itemIndex) => {
            const delta = getKpiDelta(item.key, dateSeries);
            const sparkValues = getSparkValues(item.key, dateSeries);
            const isNegative = delta < 0;

            return (
              <div key={item.key} className={styles.kpiCard}>
                <div className={styles.kpiHead}>
                  <span>{item.label}</span>
                  <mark className={isNegative ? styles.deltaNegative : styles.deltaPositive}>
                    <img
                      src={isNegative ? keyArrowDownIcon : keyArrowUpIcon}
                      alt=""
                      aria-hidden="true"
                    />
                    {isNegative ? '' : '+'}
                    {formatNumber(delta)}%
                  </mark>
                </div>
                <strong>{formatKpiValue(Number(metrics[item.key] ?? 0), item)}</strong>
                <div className={styles.sparkline} aria-hidden="true">
                  {sparkValues.map((height, index) => (
                    <i
                      key={`${item.key}-${index}`}
                      style={{
                        height: `${height}%`,
                        opacity: 0.5 + index / sparkValues.length / 2,
                      }}
                      data-tone={itemIndex % 3}
                    />
                  ))}
                </div>
              </div>
            );
          })
        ) : (
          <Empty description="Метрики пока недоступны" />
        )}
      </div>

      <div className={styles.chartGrid}>
        <div className={styles.chartPanel}>
          <div className={styles.panelTitle}>
            <h2>Динамика выручки и расходов</h2>
            <p>По датам из сопоставленной колонки Date.</p>
          </div>
          <ResponsiveContainer width="100%" height={320}>
            <LineChart data={dateSeries}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e0e3e3" />
              <XAxis dataKey="date" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip formatter={(value) => formatMoney(Number(value))} />
              <Legend />
              <Line
                type="monotone"
                dataKey="revenue"
                name="Выручка"
                stroke="#415aab"
                strokeWidth={3}
              />
              <Line
                type="monotone"
                dataKey="spend"
                name="Расходы"
                stroke="#206c3a"
                strokeWidth={3}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className={styles.chartPanel}>
          <div className={styles.panelTitle}>
            <h2>Эффективность каналов</h2>
            <p>Сравнение выручки и расходов по Channel.</p>
          </div>
          <ResponsiveContainer width="100%" height={320}>
            <BarChart data={channelSeries.slice(0, 8)}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e0e3e3" />
              <XAxis dataKey="channel" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip formatter={(value) => formatMoney(Number(value))} />
              <Legend />
              <Bar dataKey="revenue" name="Выручка" fill="#415aab" radius={[6, 6, 0, 0]} />
              <Bar dataKey="spend" name="Расходы" fill="#9aa8d8" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className={styles.contentGrid}>
        <div className={styles.panel}>
          <div className={styles.panelTitle}>
            <h2>Канальная диагностика</h2>
            <p>Доля выручки по основным каналам и быстрый срез эффективности.</p>
          </div>
          {topChannels.length > 0 ? (
            <div className={styles.channelDiagnostics}>
              <div className={styles.pieBox}>
                <ResponsiveContainer width="100%" height={280}>
                  <PieChart>
                    <Pie
                      data={topChannels}
                      dataKey="revenue"
                      nameKey="channel"
                      innerRadius={68}
                      outerRadius={108}
                      paddingAngle={2}
                      stroke="#fff"
                      strokeWidth={3}
                    >
                      {topChannels.map((channel, index) => (
                        <Cell
                          key={channel.channel}
                          fill={CHANNEL_COLORS[index % CHANNEL_COLORS.length]}
                        />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(value, name) => [formatMoney(Number(value)), String(name)]}
                    />
                  </PieChart>
                </ResponsiveContainer>
                <div className={styles.pieCenter}>
                  <span>Каналы</span>
                  <strong>{topChannels.length}</strong>
                </div>
              </div>
              <div className={styles.channelLegend}>
                {topChannels.map((channel, index) => (
                  <div key={channel.channel} className={styles.legendItem}>
                    <span
                      className={styles.legendColor}
                      style={{ backgroundColor: CHANNEL_COLORS[index % CHANNEL_COLORS.length] }}
                    />
                    <strong>{channel.channel}</strong>
                    <span>{channel.revenueShare}% выручки</span>
                    <span>ROAS {channel.roas}x</span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <Empty description="Канальные данные пока недоступны" />
          )}
        </div>

        <div className={styles.panel}>
          <div className={styles.panelTitle}>
            <h2>Качество данных</h2>
            <p>Сколько строк удалось использовать в расчетах.</p>
          </div>
          {dataQuality ? (
            <div className={styles.quality}>
              <Progress
                percent={acceptanceRate}
                status={acceptanceRate < 70 ? 'exception' : 'success'}
              />
              <div className={styles.qualityStats}>
                <span>Всего: {dataQuality.totalRows}</span>
                <span>Принято: {dataQuality.acceptedRows}</span>
                <span>Отклонено: {dataQuality.rejectedRows}</span>
                <span>Дубли: {dataQuality.duplicateRows}</span>
              </div>
              {dataQuality.warnings.length > 0 && (
                <div className={styles.warningList}>
                  {dataQuality.warnings.map((warning) => (
                    <Alert key={warning.code} showIcon type="warning" message={warning.message} />
                  ))}
                </div>
              )}
            </div>
          ) : (
            <Empty description="Отчет качества данных недоступен" />
          )}
        </div>
      </div>

      <div className={styles.insightGrid}>
        <div className={styles.swotPanel}>
          <h2>Стратегический аналитический SWOT</h2>
          <div className={styles.swotMatrix}>
            {SWOT_VIEW.map((item) => (
              <div key={item.key} className={styles.swotCell}>
                <div className={styles.swotTitle}>
                  <img src={item.icon} alt="" aria-hidden="true" />
                  <h3>{item.title}</h3>
                </div>
                <ul>
                  {getSwotItems(analysis.swotResults, item.key).map((value) => (
                    <li key={value}>{localizeSwotText(value)}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        <div className={styles.recommendationsPanel}>
          <div className={styles.panelTitle}>
            <h2>Рекомендации</h2>
            <p>
              {isAiRecommendations
                ? 'AI-рекомендации сформированы на основе рассчитанных метрик и диагностического слоя.'
                : 'Fallback-режим: рекомендации построены правилами поверх рассчитанных метрик.'}
            </p>
          </div>
          <div className={styles.recommendations}>
            {recommendations.length > 0 ? (
              recommendations.map((recommendation) => (
                <article key={recommendation.title} className={styles.recommendationCard}>
                  <div className={styles.recommendationMeta}>
                    <Tag color={SEVERITY_COLOR[recommendation.severity]}>
                      {SEVERITY_LABEL[recommendation.severity]}
                    </Tag>
                    <strong>{getRecommendationImpact(recommendation)}</strong>
                  </div>
                  <h3>{localizeRecommendationText(recommendation.title)}</h3>
                  <p>{localizeRecommendationText(recommendation.explanation)}</p>
                  <span>{CATEGORY_LABEL[recommendation.category]}</span>
                </article>
              ))
            ) : (
              <Empty description="Критичных рекомендаций не найдено" />
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
