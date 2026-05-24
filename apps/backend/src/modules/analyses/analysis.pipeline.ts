import fs from 'node:fs';
import readline from 'node:readline';
import Papa from 'papaparse';
import xlsx from 'xlsx';

import type {
  IDatasetColumnMappingRule,
  IDatasetVersionRecord,
} from '../datasets/dataset.types.js';
import type { DatasetColumnKey } from '../uploads/upload.types.js';

type CellValue = string | number | boolean | null;

interface IRawRow {
  [key: string]: CellValue;
}

interface INormalizedRow {
  date?: string;
  channel?: string;
  spend?: number;
  trafficLeads?: number;
  newOrders?: number;
  returningOrders?: number;
  revenue?: number;
}

interface IAggregate {
  revenue: number;
  spend: number;
  trafficLeads: number;
  newOrders: number;
  returningOrders: number;
  totalOrders: number;
  rowCount: number;
}

interface IChannelAggregate extends IAggregate {
  channel: string;
}

interface IDateAggregate extends IAggregate {
  date: string;
}

interface IRecommendation {
  title: string;
  severity: 'low' | 'medium' | 'high';
  category: 'growth' | 'efficiency' | 'risk' | 'retention' | 'data_quality';
  explanation: string;
  evidence: Record<string, unknown>;
  suggestedAction: string;
}

const REQUIRED_COLUMNS: DatasetColumnKey[] = [
  'date',
  'channel',
  'spend',
  'traffic_leads',
  'new_orders',
  'returning_orders',
  'revenue',
];

const NUMERIC_COLUMNS: DatasetColumnKey[] = [
  'spend',
  'traffic_leads',
  'new_orders',
  'returning_orders',
  'revenue',
];

function getFileExtension(filename: string) {
  const dotIndex = filename.lastIndexOf('.');

  return dotIndex === -1 ? '' : filename.slice(dotIndex).toLowerCase();
}

function parseCsvLine(line: string) {
  const result = Papa.parse<string[]>(line.trim(), {
    delimiter: '',
    skipEmptyLines: false,
  });

  return result.data[0] ?? [];
}

async function readCsvRows(filePath: string): Promise<IRawRow[]> {
  const stream = fs.createReadStream(filePath);
  const lines = readline.createInterface({
    input: stream,
    crlfDelay: Infinity,
  });
  let headers: string[] = [];
  const rows: IRawRow[] = [];

  for await (const line of lines) {
    if (line.trim() === '') {
      continue;
    }

    if (headers.length === 0) {
      headers = parseCsvLine(line).map((header) => header.trim());
      continue;
    }

    const cells = parseCsvLine(line);
    rows.push(
      Object.fromEntries(
        headers.map((header, index) => [
          header,
          cells[index] === '' ? null : (cells[index] ?? null),
        ]),
      ),
    );
  }

  lines.close();
  stream.destroy();

  return rows;
}

function readExcelRows(filePath: string): IRawRow[] {
  const workbook = xlsx.readFile(filePath);
  const [sheetName] = workbook.SheetNames;

  if (!sheetName) {
    return [];
  }

  return xlsx.utils.sheet_to_json<IRawRow>(workbook.Sheets[sheetName], {
    defval: null,
    raw: false,
  });
}

async function readRows(version: IDatasetVersionRecord) {
  return getFileExtension(version.originalFilename) === '.csv'
    ? readCsvRows(version.originalFilePath)
    : readExcelRows(version.originalFilePath);
}

function applyEditPatch(rows: IRawRow[], version: IDatasetVersionRecord) {
  const patch = version.editPatch;

  if (!patch) {
    return rows;
  }

  const deletedRows = new Set(patch.deletedRows);
  const updatedRows = new Map(patch.updatedRows.map((row) => [row.rowIndex, row.values]));
  const patchedRows = rows
    .map((row, index) => ({
      ...row,
      ...updatedRows.get(index),
    }))
    .filter((_, index) => !deletedRows.has(index));

  return [...patchedRows, ...patch.addedRows] as IRawRow[];
}

function normalizeNumber(value: unknown): number | null {
  if (value === null || value === undefined || value === '') {
    return null;
  }

  const normalized = String(value)
    .replace(/\s/g, '')
    .replace(',', '.')
    .replace(/[₽руб.]/gi, '');
  const parsed = Number(normalized);

  return Number.isFinite(parsed) ? parsed : null;
}

function normalizeDate(value: unknown): string | null {
  if (value === null || value === undefined || value === '') {
    return null;
  }

  const parsed = new Date(String(value));

  if (Number.isNaN(parsed.getTime())) {
    return null;
  }

  return parsed.toISOString().slice(0, 10);
}

function normalizeString(value: unknown): string | null {
  if (value === null || value === undefined || value === '') {
    return null;
  }

  return String(value).trim() || null;
}

function getMappedValue(row: IRawRow, rule: IDatasetColumnMappingRule | undefined) {
  return rule ? row[rule.source] : undefined;
}

function normalizeRows(rows: IRawRow[], version: IDatasetVersionRecord) {
  const missingRequiredColumns = REQUIRED_COLUMNS.filter(
    (column) => !version.mappingConfig[column]?.source,
  );
  const missingValueCounts = Object.fromEntries(
    REQUIRED_COLUMNS.map((column) => [column, 0]),
  ) as Record<DatasetColumnKey, number>;
  const invalidValueCounts = Object.fromEntries(
    REQUIRED_COLUMNS.map((column) => [column, 0]),
  ) as Record<DatasetColumnKey, number>;
  const normalizedRows: INormalizedRow[] = [];
  const rejectedRows: Array<{ rowIndex: number; reason: string }> = [];
  const seenRows = new Set<string>();
  let duplicateRows = 0;

  rows.forEach((row, index) => {
    const fingerprint = JSON.stringify(row);

    if (seenRows.has(fingerprint)) {
      duplicateRows += 1;
      return;
    }

    seenRows.add(fingerprint);

    const normalized: INormalizedRow = {};
    const date = normalizeDate(getMappedValue(row, version.mappingConfig.date));
    const channel = normalizeString(getMappedValue(row, version.mappingConfig.channel));

    if (version.mappingConfig.date && !date) {
      invalidValueCounts.date += 1;
    }

    if (version.mappingConfig.channel && !channel) {
      missingValueCounts.channel += 1;
    }

    if (date) {
      normalized.date = date;
    }

    if (channel) {
      normalized.channel = channel;
    }

    for (const column of NUMERIC_COLUMNS) {
      const rule = version.mappingConfig[column];

      if (!rule) {
        continue;
      }

      const rawValue = getMappedValue(row, rule);
      const value = normalizeNumber(rawValue);

      if (rawValue === null || rawValue === undefined || rawValue === '') {
        missingValueCounts[column] += 1;
        continue;
      }

      if (value === null || value < 0) {
        invalidValueCounts[column] += 1;
        continue;
      }

      if (column === 'spend') {
        normalized.spend = value;
      } else if (column === 'traffic_leads') {
        normalized.trafficLeads = value;
      } else if (column === 'new_orders') {
        normalized.newOrders = value;
      } else if (column === 'returning_orders') {
        normalized.returningOrders = value;
      } else if (column === 'revenue') {
        normalized.revenue = value;
      }
    }

    const hasAnalyticalSignal =
      normalized.revenue !== undefined ||
      normalized.spend !== undefined ||
      normalized.trafficLeads !== undefined ||
      normalized.newOrders !== undefined ||
      normalized.returningOrders !== undefined;

    if (!hasAnalyticalSignal) {
      rejectedRows.push({ rowIndex: index, reason: 'No mapped analytical values' });
      return;
    }

    normalizedRows.push(normalized);
  });

  return {
    normalizedRows,
    report: {
      totalRows: rows.length,
      acceptedRows: normalizedRows.length,
      rejectedRows: rejectedRows.length,
      duplicateRows,
      missingRequiredColumns,
      missingValueCounts,
      invalidValueCounts,
      rejectedSamples: rejectedRows.slice(0, 20),
      warnings: buildDataQualityWarnings({
        totalRows: rows.length,
        acceptedRows: normalizedRows.length,
        missingRequiredColumns,
        duplicateRows,
      }),
    },
  };
}

function buildDataQualityWarnings(input: {
  totalRows: number;
  acceptedRows: number;
  missingRequiredColumns: DatasetColumnKey[];
  duplicateRows: number;
}) {
  const warnings: Array<{ code: string; message: string }> = [];

  if (input.missingRequiredColumns.length > 0) {
    warnings.push({
      code: 'missing_required_columns',
      message: `Не сопоставлены обязательные колонки: ${input.missingRequiredColumns.join(', ')}`,
    });
  }

  if (input.totalRows > 0 && input.acceptedRows / input.totalRows < 0.7) {
    warnings.push({
      code: 'low_acceptance_rate',
      message: 'Для аналитики принято меньше 70% строк. Проверьте маппинг и значения в файле.',
    });
  }

  if (input.duplicateRows > 0) {
    warnings.push({
      code: 'duplicates_found',
      message: `Пропущено строк-дублей: ${input.duplicateRows}.`,
    });
  }

  return warnings;
}

function createEmptyAggregate(): IAggregate {
  return {
    revenue: 0,
    spend: 0,
    trafficLeads: 0,
    newOrders: 0,
    returningOrders: 0,
    totalOrders: 0,
    rowCount: 0,
  };
}

function addRowToAggregate(aggregate: IAggregate, row: INormalizedRow) {
  aggregate.revenue += row.revenue ?? 0;
  aggregate.spend += row.spend ?? 0;
  aggregate.trafficLeads += row.trafficLeads ?? 0;
  aggregate.newOrders += row.newOrders ?? 0;
  aggregate.returningOrders += row.returningOrders ?? 0;
  aggregate.totalOrders += (row.newOrders ?? 0) + (row.returningOrders ?? 0);
  aggregate.rowCount += 1;
}

function round(value: number, fractionDigits = 2) {
  return Number.isFinite(value) ? Number(value.toFixed(fractionDigits)) : 0;
}

function safeDivide(numerator: number, denominator: number) {
  return denominator === 0 ? 0 : numerator / denominator;
}

function enrichAggregate<TAggregate extends IAggregate>(aggregate: TAggregate) {
  return {
    ...aggregate,
    revenue: round(aggregate.revenue),
    spend: round(aggregate.spend),
    trafficLeads: round(aggregate.trafficLeads),
    newOrders: round(aggregate.newOrders),
    returningOrders: round(aggregate.returningOrders),
    totalOrders: round(aggregate.totalOrders),
    roas: round(safeDivide(aggregate.revenue, aggregate.spend)),
    cac: round(safeDivide(aggregate.spend, aggregate.newOrders)),
    aov: round(safeDivide(aggregate.revenue, aggregate.totalOrders)),
    conversionRate: round(safeDivide(aggregate.newOrders, aggregate.trafficLeads) * 100),
    repeatOrderShare: round(safeDivide(aggregate.returningOrders, aggregate.totalOrders) * 100),
    profitProxy: round(aggregate.revenue - aggregate.spend),
  };
}

function aggregateRows(rows: INormalizedRow[]) {
  const totals = createEmptyAggregate();
  const byDate = new Map<string, IDateAggregate>();
  const byChannel = new Map<string, IChannelAggregate>();

  for (const row of rows) {
    addRowToAggregate(totals, row);

    if (row.date) {
      const aggregate = byDate.get(row.date) ?? { date: row.date, ...createEmptyAggregate() };
      addRowToAggregate(aggregate, row);
      byDate.set(row.date, aggregate);
    }

    if (row.channel) {
      const aggregate = byChannel.get(row.channel) ?? {
        channel: row.channel,
        ...createEmptyAggregate(),
      };
      addRowToAggregate(aggregate, row);
      byChannel.set(row.channel, aggregate);
    }
  }

  const enrichedTotals = enrichAggregate(totals);
  const dateSeries = [...byDate.values()]
    .sort((left, right) => left.date.localeCompare(right.date))
    .map(enrichAggregate);
  const channelSeries = [...byChannel.values()]
    .sort((left, right) => right.revenue - left.revenue)
    .map((aggregate) => ({
      ...enrichAggregate(aggregate),
      revenueShare: round(safeDivide(aggregate.revenue, totals.revenue) * 100),
      spendShare: round(safeDivide(aggregate.spend, totals.spend) * 100),
    }));

  return {
    totals: enrichedTotals,
    dateSeries,
    channelSeries,
  };
}

function detectAnomalies(dateSeries: Array<ReturnType<typeof enrichAggregate<IDateAggregate>>>) {
  if (dateSeries.length < 4) {
    return {
      items: [],
      summary: 'Not enough date points for anomaly detection.',
    };
  }

  const averageRevenue =
    dateSeries.reduce((sum, item) => sum + item.revenue, 0) / dateSeries.length;
  const averageSpend = dateSeries.reduce((sum, item) => sum + item.spend, 0) / dateSeries.length;
  const items = dateSeries
    .filter(
      (item) =>
        item.revenue > averageRevenue * 1.5 ||
        item.revenue < averageRevenue * 0.5 ||
        item.spend > averageSpend * 1.5,
    )
    .map((item) => ({
      date: item.date,
      revenue: item.revenue,
      spend: item.spend,
      reason:
        item.spend > averageSpend * 1.5
          ? 'Всплеск расходов'
          : item.revenue > averageRevenue * 1.5
            ? 'Всплеск выручки'
            : 'Падение выручки',
    }));

  return {
    items,
    summary:
      items.length > 0
        ? `Найдено потенциальных аномалий: ${items.length}.`
        : 'Явных аномалий не найдено.',
  };
}

function buildDiagnostics(input: {
  totals: ReturnType<typeof enrichAggregate<IAggregate>>;
  channelSeries: Array<
    ReturnType<typeof enrichAggregate<IChannelAggregate>> & {
      revenueShare: number;
      spendShare: number;
    }
  >;
}) {
  const efficientChannels = input.channelSeries.filter(
    (channel) => channel.roas > input.totals.roas && channel.spendShare < 30,
  );
  const inefficientChannels = input.channelSeries.filter(
    (channel) => channel.spendShare > channel.revenueShare && channel.roas < input.totals.roas,
  );
  const concentrationRisk = input.channelSeries.find((channel) => channel.revenueShare >= 55);

  return {
    bestChannels: input.channelSeries.slice(0, 3),
    efficientChannels,
    inefficientChannels,
    concentrationRisk: concentrationRisk
      ? {
          channel: concentrationRisk.channel,
          revenueShare: concentrationRisk.revenueShare,
        }
      : null,
    summary: {
      totalChannels: input.channelSeries.length,
      averageRoas: input.totals.roas,
      averageCac: input.totals.cac,
    },
  };
}

function buildRecommendations(input: {
  dataQuality: Record<string, unknown>;
  totals: ReturnType<typeof enrichAggregate<IAggregate>>;
  diagnostics: ReturnType<typeof buildDiagnostics>;
  anomalies: ReturnType<typeof detectAnomalies>;
}) {
  const recommendations: IRecommendation[] = [];

  for (const channel of input.diagnostics.inefficientChannels.slice(0, 3)) {
    recommendations.push({
      title: `Проверьте эффективность расходов в канале ${channel.channel}`,
      severity: channel.spendShare > 35 ? 'high' : 'medium',
      category: 'efficiency',
      explanation: 'Канал забирает большую долю рекламного бюджета, чем возвращает в выручке.',
      evidence: {
        channel: channel.channel,
        spendShare: channel.spendShare,
        revenueShare: channel.revenueShare,
        roas: channel.roas,
      },
      suggestedAction:
        'Снизьте бюджет или пересмотрите таргетинг, оффер и качество посадочной страницы для этого канала.',
    });
  }

  for (const channel of input.diagnostics.efficientChannels.slice(0, 2)) {
    recommendations.push({
      title: `Проверьте масштабирование бюджета в канале ${channel.channel}`,
      severity: 'medium',
      category: 'growth',
      explanation:
        'Канал показывает ROAS выше среднего и при этом не занимает чрезмерную долю бюджета.',
      evidence: {
        channel: channel.channel,
        spendShare: channel.spendShare,
        roas: channel.roas,
      },
      suggestedAction:
        'Запустите контролируемое увеличение бюджета и отслеживайте CAC, конверсию и итоговый ROAS.',
    });
  }

  if (input.totals.repeatOrderShare < 20 && input.totals.totalOrders > 0) {
    recommendations.push({
      title: 'Усилить механику повторных покупок',
      severity: 'medium',
      category: 'retention',
      explanation: 'Повторные заказы занимают небольшую долю от общего количества заказов.',
      evidence: {
        repeatOrderShare: input.totals.repeatOrderShare,
      },
      suggestedAction:
        'Запустите ремаркетинг, персональные предложения лояльности и post-purchase коммуникации.',
    });
  }

  if (input.diagnostics.concentrationRisk) {
    recommendations.push({
      title: 'Снизить риск концентрации выручки',
      severity: 'high',
      category: 'risk',
      explanation: 'Выручка слишком сильно зависит от одного канала привлечения.',
      evidence: input.diagnostics.concentrationRisk,
      suggestedAction:
        'Диверсифицируйте каналы привлечения и отдельно защитите ведущий канал от просадок.',
    });
  }

  if (input.anomalies.items.length > 0) {
    recommendations.push({
      title: 'Разобрать аномальные даты',
      severity: 'medium',
      category: 'risk',
      explanation: 'Во временном ряду есть необычные движения выручки или расходов.',
      evidence: {
        anomalies: input.anomalies.items.slice(0, 5),
      },
      suggestedAction:
        'Проверьте изменения в кампаниях, доступность сайта, остатки товаров и корректность трекинга в эти даты.',
    });
  }

  const warnings = input.dataQuality.warnings as unknown[];

  if (warnings.length > 0) {
    recommendations.push({
      title: 'Повысить качество исходных данных',
      severity: 'medium',
      category: 'data_quality',
      explanation:
        'Часть сопоставленных колонок или строк требует проверки перед более глубоким анализом.',
      evidence: {
        warnings,
      },
      suggestedAction:
        'Дозаполните маппинг и исправьте некорректные значения перед использованием дашборда для решений.',
    });
  }

  return {
    items: recommendations,
    generatedBy: 'rule_based_engine_v1',
  };
}

function buildSwot(input: {
  totals: ReturnType<typeof enrichAggregate<IAggregate>>;
  diagnostics: ReturnType<typeof buildDiagnostics>;
  anomalies: ReturnType<typeof detectAnomalies>;
}) {
  const strengths: string[] = [];
  const weaknesses: string[] = [];
  const opportunities: string[] = [];
  const threats: string[] = [];

  if (input.totals.roas >= 3) {
    strengths.push(`Общий ROAS на хорошем уровне: ${input.totals.roas}x.`);
  }

  if (input.totals.repeatOrderShare >= 25) {
    strengths.push(
      `Повторные заказы дают ${input.totals.repeatOrderShare}% от общего числа заказов.`,
    );
  }

  if (input.diagnostics.bestChannels[0]) {
    strengths.push(`Ведущий канал по выручке: ${input.diagnostics.bestChannels[0].channel}.`);
  }

  if (input.totals.conversionRate < 5 && input.totals.trafficLeads > 0) {
    weaknesses.push(`Низкая конверсия: ${input.totals.conversionRate}%.`);
  }

  if (input.totals.cac > input.totals.aov * 0.4 && input.totals.aov > 0) {
    weaknesses.push('CAC выглядит высоким относительно среднего чека.');
  }

  if (input.totals.repeatOrderShare < 20 && input.totals.totalOrders > 0) {
    weaknesses.push('Удержание слабое: повторные заказы ниже 20%.');
  }

  for (const channel of input.diagnostics.efficientChannels.slice(0, 2)) {
    opportunities.push(`Аккуратно масштабировать эффективный канал ${channel.channel}.`);
  }

  if (input.diagnostics.inefficientChannels.length > 0) {
    opportunities.push('Перераспределить бюджет из слабых каналов в более результативные.');
  }

  if (input.diagnostics.concentrationRisk) {
    threats.push(
      `Риск концентрации выручки: канал ${input.diagnostics.concentrationRisk.channel} дает ${input.diagnostics.concentrationRisk.revenueShare}% выручки.`,
    );
  }

  if (input.anomalies.items.length > 0) {
    threats.push(
      'Обнаруженные аномалии могут указывать на проблемы трекинга, кампаний или операционных процессов.',
    );
  }

  return {
    strengths,
    weaknesses,
    opportunities,
    threats,
  };
}

export async function buildAnalysisSnapshot(version: IDatasetVersionRecord) {
  const rawRows = await readRows(version);
  const patchedRows = applyEditPatch(rawRows, version);
  const { normalizedRows, report } = normalizeRows(patchedRows, version);
  const { totals, dateSeries, channelSeries } = aggregateRows(normalizedRows);
  const anomalies = detectAnomalies(dateSeries);
  const diagnostics = buildDiagnostics({ totals, channelSeries });
  const recommendations = buildRecommendations({
    dataQuality: report,
    totals,
    diagnostics,
    anomalies,
  });
  const swot = buildSwot({ totals, diagnostics, anomalies });
  const hasPartialData = report.missingRequiredColumns.length > 0 || report.warnings.length > 0;

  return {
    status: hasPartialData ? ('partial_success' as const) : ('completed' as const),
    dataQuality: report,
    kpiMetrics: totals,
    chartsData: {
      dateSeries,
      channelSeries,
    },
    diagnostics,
    segments: {
      channels: channelSeries,
    },
    cohorts: {
      items: [],
      summary: 'Когортный анализ требует идентификаторов клиентов и будет добавлен позже.',
    },
    anomalies,
    tradeoffs: {
      budgetEfficiency: channelSeries.map((channel) => ({
        channel: channel.channel,
        spendShare: channel.spendShare,
        revenueShare: channel.revenueShare,
        roas: channel.roas,
      })),
    },
    swotResults: swot,
    recommendations,
  };
}
