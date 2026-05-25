import { z } from 'zod';

import { env } from '../../env.js';
import type { buildAnalysisSnapshot } from './analysis.pipeline.js';

type AnalysisSnapshot = Awaited<ReturnType<typeof buildAnalysisSnapshot>>;

type AiEnhancementStatus = 'applied' | 'skipped' | 'failed';

interface IAiEnhancementResult {
  snapshot: AnalysisSnapshot;
  status: AiEnhancementStatus;
  message: string;
  payload?: Record<string, unknown>;
}

class LlmHttpError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = 'LlmHttpError';
    this.status = status;
  }
}

class LlmFormatError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'LlmFormatError';
  }
}

const recommendationCategorySchema = z.enum([
  'growth',
  'efficiency',
  'risk',
  'retention',
  'data_quality',
]);

const recommendationSeveritySchema = z.enum(['low', 'medium', 'high']);

const aiRecommendationSchema = z.object({
  title: z.string().min(8).max(220),
  severity: recommendationSeveritySchema,
  category: recommendationCategorySchema,
  explanation: z.string().min(20).max(800),
  suggestedAction: z.string().min(20).max(800),
  expectedImpact: z.string().min(2).max(220).optional(),
});

const aiSwotSchema = z.object({
  strengths: z.array(z.string().min(6).max(260)).max(5),
  weaknesses: z.array(z.string().min(6).max(260)).max(5),
  opportunities: z.array(z.string().min(6).max(260)).max(5),
  threats: z.array(z.string().min(6).max(260)).max(5),
});

const aiAnalysisResponseSchema = z.object({
  recommendations: z.array(aiRecommendationSchema).min(1).max(5),
  swot: aiSwotSchema,
});

type AiAnalysisResponse = z.infer<typeof aiAnalysisResponseSchema>;
type PartialAiAnalysisResponse = {
  recommendations: AiAnalysisResponse['recommendations'];
  swot: AiAnalysisResponse['swot'];
};
type ChatMessage = {
  role: 'system' | 'user';
  content: string;
};

const META_TEXT_PATTERNS = [
  /<--/i,
  /\boops\b/i,
  /\bwe\s*need\b/i,
  /\bneed\s+to\s+close\b/i,
  /\bclose\s+json\b/i,
  /\brewrite\s+final\b/i,
  /\bensure\s+no\b/i,
  /\btrailing\s+text\b/i,
  /\binvalidresponse\b/i,
  /\brequiredschema\b/i,
  /\bmarkdown\b/i,
  /\bproperly\b/i,
  /\blet!?$/i,
];

const CATEGORY_ALIASES: Record<string, z.infer<typeof recommendationCategorySchema>> = {
  acquisition: 'growth',
  budget: 'efficiency',
  channel: 'efficiency',
  conversion: 'growth',
  data: 'data_quality',
  dataQuality: 'data_quality',
  quality: 'data_quality',
  roi: 'efficiency',
  sales: 'growth',
  retention_rate: 'retention',
  growth_opportunity: 'growth',
  efficiency_risk: 'efficiency',
  concentration_risk: 'risk',
  anomaly_risk: 'risk',
  риск: 'risk',
  рост: 'growth',
  эффективность: 'efficiency',
  удержание: 'retention',
  качество_данных: 'data_quality',
};

const SEVERITY_ALIASES: Record<string, z.infer<typeof recommendationSeveritySchema>> = {
  critical: 'high',
  high: 'high',
  low: 'low',
  medium: 'medium',
  moderate: 'medium',
  normal: 'medium',
  urgent: 'high',
  высочайшее: 'high',
  высокая: 'high',
  высокое: 'high',
  высокий: 'high',
  средняя: 'medium',
  среднее: 'medium',
  средний: 'medium',
  низкая: 'low',
  низкое: 'low',
  низкий: 'low',
};

function getLlmBaseUrl() {
  if (env.llmProvider === 'groq') {
    return 'https://api.groq.com/openai/v1';
  }

  return 'https://openrouter.ai/api/v1';
}

function getLevel(value: number, thresholds: { high: number; medium: number }) {
  if (value >= thresholds.high) {
    return 'very_high';
  }

  if (value >= thresholds.medium) {
    return 'healthy';
  }

  return 'needs_attention';
}

function buildInterpretationHints(snapshot: AnalysisSnapshot) {
  const prioritySignals: Array<{ type: string; message: string }> = [];
  const [bestChannel] = snapshot.diagnostics.bestChannels;
  const [efficientChannel] = snapshot.diagnostics.efficientChannels;
  const inefficientChannels = snapshot.diagnostics.inefficientChannels.slice(0, 3);

  if (efficientChannel) {
    prioritySignals.push({
      type: 'growth_opportunity',
      message: `${efficientChannel.channel} имеет ROAS ${efficientChannel.roas}x при доле расходов ${efficientChannel.spendShare}%.`,
    });
  }

  for (const channel of inefficientChannels) {
    prioritySignals.push({
      type: 'efficiency_risk',
      message: `${channel.channel}: ROAS ${channel.roas}x ниже среднего ${snapshot.kpiMetrics.roas}x, доля расходов ${channel.spendShare}% против доли выручки ${channel.revenueShare}%.`,
    });
  }

  if (snapshot.diagnostics.concentrationRisk) {
    prioritySignals.push({
      type: 'concentration_risk',
      message: `${snapshot.diagnostics.concentrationRisk.channel} дает ${snapshot.diagnostics.concentrationRisk.revenueShare}% выручки.`,
    });
  }

  if (snapshot.anomalies.items.length > 0) {
    prioritySignals.push({
      type: 'anomaly_risk',
      message: `${snapshot.anomalies.items.length} аномальных дат: проверьте акции, сезонность, трекинг и операционные сбои.`,
    });
  }

  if (snapshot.dataQuality.warnings.length > 0) {
    prioritySignals.push({
      type: 'data_quality_risk',
      message: `Есть предупреждения качества данных: ${snapshot.dataQuality.warnings
        .map((warning) => warning.message)
        .join('; ')}`,
    });
  }

  return {
    overallAssessment: {
      roasLevel: getLevel(snapshot.kpiMetrics.roas, { high: 6, medium: 2 }),
      conversionLevel: getLevel(snapshot.kpiMetrics.conversionRate, { high: 15, medium: 5 }),
      repeatOrdersLevel: getLevel(snapshot.kpiMetrics.repeatOrderShare, { high: 25, medium: 15 }),
      dataQualityLevel:
        snapshot.dataQuality.warnings.length === 0 && snapshot.dataQuality.acceptedRows > 0
          ? 'clean'
          : 'needs_attention',
      topRevenueChannel: bestChannel?.channel ?? null,
    },
    prioritySignals: prioritySignals.slice(0, 8),
  };
}

function buildAiContext(snapshot: AnalysisSnapshot) {
  return {
    businessContext: {
      domain: 'marketing_analytics_for_small_business',
      currency: 'RUB',
      language: 'ru',
    },
    dataQuality: {
      totalRows: snapshot.dataQuality.totalRows,
      acceptedRows: snapshot.dataQuality.acceptedRows,
      rejectedRows: snapshot.dataQuality.rejectedRows,
      duplicateRows: snapshot.dataQuality.duplicateRows,
      missingRequiredColumns: snapshot.dataQuality.missingRequiredColumns,
      warnings: snapshot.dataQuality.warnings,
    },
    kpiMetrics: snapshot.kpiMetrics,
    channelDiagnostics: {
      bestChannels: snapshot.diagnostics.bestChannels.slice(0, 5),
      efficientChannels: snapshot.diagnostics.efficientChannels.slice(0, 5),
      inefficientChannels: snapshot.diagnostics.inefficientChannels.slice(0, 5),
      concentrationRisk: snapshot.diagnostics.concentrationRisk,
      summary: snapshot.diagnostics.summary,
    },
    chartsSummary: {
      topChannels: snapshot.chartsData.channelSeries.slice(0, 8),
      dateSeriesFirstPoint: snapshot.chartsData.dateSeries.at(0) ?? null,
      dateSeriesLastPoint: snapshot.chartsData.dateSeries.at(-1) ?? null,
      recentDateSeries: snapshot.chartsData.dateSeries.slice(-8),
    },
    anomalies: {
      summary: snapshot.anomalies.summary,
      items: snapshot.anomalies.items.slice(0, 8),
    },
    interpretationHints: buildInterpretationHints(snapshot),
    ruleBasedRecommendations: snapshot.recommendations.items.slice(0, 6),
    ruleBasedSwot: snapshot.swotResults,
  };
}

function buildAiPrompt(snapshot: AnalysisSnapshot): ChatMessage[] {
  return [
    {
      role: 'system',
      content:
        'Ты senior BI-аналитик и маркетинговый стратег для малого бизнеса. Твоя задача — не пересказывать метрики, а интерпретировать маркетинговую картину: каналы привлечения, окупаемость бюджета, качество трафика, повторные заказы, аномалии, риски и возможности роста. Работай строго только с переданным JSON-контекстом. Не выдумывай факты, каналы, суммы, проценты, маржинальность, LTV, сезонность и причинно-следственные связи, которых нет в данных. Пиши на русском языке для владельца малого бизнеса или маркетолога без BI-подготовки. Верни только валидный компактный JSON без markdown, комментариев, текста вокруг JSON и переносов внутри строк.',
    },
    {
      role: 'user',
      content: JSON.stringify({
        promptFramework: 'CO-STAR',
        context: {
          situation:
            'Пользователь загрузил маркетингово-коммерческий датасет малого бизнеса. Backend уже выполнил ETL, маппинг, очистку, расчет KPI, канальную диагностику, поиск аномалий и rule-based диагностику.',
          businessFocus: [
            'оценка эффективности маркетинговых каналов',
            'поиск точек роста выручки',
            'поиск неэффективных расходов',
            'оценка качества трафика и конверсии',
            'оценка повторных заказов и удержания',
            'выявление рисков концентрации и аномалий',
          ],
          dataLimitations: [
            'работай только с агрегированными метриками',
            'не делай выводы о причинах, если их нет в данных',
            'если данных недостаточно для уверенного вывода, укажи это как ограничение',
          ],
        },
        objective: {
          mainGoal:
            'Сформировать качественные AI-рекомендации и SWOT-анализ по маркетинговой стороне бизнеса.',
          whatToDo: [
            'оцени общую маркетинговую картину бизнеса',
            'выдели 3-5 наиболее важных управленческих рекомендаций',
            'приоритизируй рекомендации по влиянию и срочности',
            'объясни каждую рекомендацию через конкретные метрики из context',
            'сформулируй конкретное действие, которое пользователь может выполнить',
            'сформируй SWOT-анализ, где каждый пункт связан с данными',
          ],
          whatToAvoid: [
            'не давай общие советы без привязки к метрикам',
            'не повторяй одну и ту же рекомендацию разными словами',
            'не используй академический язык',
            'не делай вид, что знаешь маржинальность, LTV, сезонность или когорты, если этих данных нет',
          ],
        },
        style: {
          writingStyle: 'стиль опытного BI-консультанта и маркетингового стратега',
          recommendationStyle: 'коротко, конкретно, с управленческим смыслом',
          swotStyle: 'прикладной стратегический срез бизнеса, а не учебный SWOT',
        },
        tone: {
          tone: 'спокойный, профессиональный, уверенный',
          avoidTone: ['паника', 'канцелярит', 'рекламные лозунги', 'общие формулировки'],
        },
        audience: {
          primaryAudience: 'владелец малого бизнеса или маркетолог',
          audienceKnowledge: 'понимает бизнес, но не обязан разбираться в BI, SQL и статистике',
          decisionContext:
            'человек хочет понять, куда перераспределить бюджет, какие каналы развивать, где риски и что делать дальше',
        },
        response: {
          language: 'ru',
          format: 'strict_json',
          schema: {
            recommendations: [
              {
                title: 'string',
                severity: 'high | medium | low',
                category: 'growth | efficiency | risk | retention | data_quality',
                explanation: 'string',
                suggestedAction: 'string',
                expectedImpact: 'string',
              },
            ],
            swot: {
              strengths: ['string'],
              weaknesses: ['string'],
              opportunities: ['string'],
              threats: ['string'],
            },
          },
          rules: [
            'recommendations должен содержать от 3 до 5 пунктов',
            "ровно 1 рекомендация должна иметь severity='high', если есть явный риск или сильная возможность роста",
            "минимум 1 рекомендация должна иметь severity='medium'",
            "минимум 1 рекомендация должна иметь severity='low', если есть действие меньшей срочности",
            "severity='high' используй для высокого влияния на выручку, расходы, риск концентрации, аномалии или качество данных",
            "severity='medium' используй для важных, но не критичных улучшений",
            "severity='low' используй для полезных оптимизаций без срочности",
            'каждая explanation должна ссылаться минимум на одну метрику или канал из analysisContext',
            'каждая suggestedAction должна быть конкретным действием',
            "expectedImpact должен быть кратким: '+5-10% к ROAS', 'ниже CAC', 'меньше риск зависимости от канала'",
            'в текстовых значениях запрещены служебные фразы о JSON, markdown, schema, исправлении ответа или закрытии скобок',
            'в текстовых значениях не должно быть фигурных и квадратных скобок',
            'не возвращай markdown и текст вне JSON',
          ],
        },
        analysisContext: buildAiContext(snapshot),
      }),
    },
  ];
}

function extractJsonObject(content: string) {
  const trimmed = content.trim();
  const withoutFence = trimmed
    .replace(/^```(?:json)?\s*/i, '')
    .replace(/```$/i, '')
    .trim();

  if (withoutFence.startsWith('{')) {
    return withoutFence;
  }

  const firstBrace = withoutFence.indexOf('{');
  const lastBrace = withoutFence.lastIndexOf('}');

  if (firstBrace === -1 || lastBrace === -1 || lastBrace <= firstBrace) {
    throw new Error('LLM response does not contain JSON object');
  }

  return withoutFence.slice(firstBrace, lastBrace + 1);
}

function getObjectField(source: Record<string, unknown>, keys: string[]) {
  for (const key of keys) {
    if (source[key] !== undefined) {
      return source[key];
    }
  }

  return undefined;
}

function containsMetaText(value: string) {
  return META_TEXT_PATTERNS.some((pattern) => pattern.test(value)) || /[{}[\]]/.test(value);
}

function sanitizeBusinessText(value: string) {
  const normalized = value.replace(/\s+/g, ' ').trim();

  if (!normalized || containsMetaText(normalized)) {
    return '';
  }

  return normalized;
}

function coerceString(value: unknown, fallback: string, maxLength = 800) {
  const normalized = typeof value === 'string' ? sanitizeBusinessText(value) : '';
  const result = normalized || sanitizeBusinessText(fallback) || fallback;

  return result.length > maxLength ? result.slice(0, maxLength - 1).trimEnd() : result;
}

function ensureMinLength(value: string, suffix: string, minLength = 20) {
  return value.length < minLength ? `${value}. ${suffix}` : value;
}

function coerceStringArray(value: unknown) {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((item) => coerceString(item, '', 260))
    .filter(Boolean)
    .slice(0, 5);
}

function coerceRecommendationList(value: unknown) {
  if (Array.isArray(value)) {
    return value;
  }

  if (value && typeof value === 'object') {
    return Object.values(value as Record<string, unknown>).filter(
      (item) => item && typeof item === 'object',
    );
  }

  return [];
}

function normalizeCategory(value: unknown): z.infer<typeof recommendationCategorySchema> {
  if (typeof value !== 'string') {
    return 'efficiency';
  }

  const normalized = value.trim().toLowerCase() as z.infer<typeof recommendationCategorySchema>;
  const parsed = recommendationCategorySchema.safeParse(normalized);

  if (parsed.success) {
    return parsed.data;
  }

  return CATEGORY_ALIASES[normalized] ?? 'efficiency';
}

function normalizeSeverity(value: unknown): z.infer<typeof recommendationSeveritySchema> {
  if (typeof value !== 'string') {
    return 'medium';
  }

  return SEVERITY_ALIASES[value.trim().toLowerCase()] ?? 'medium';
}

function rebalanceRecommendationSeverity(
  recommendations: Array<AiAnalysisResponse['recommendations'][number]>,
) {
  if (recommendations.length < 3) {
    return recommendations;
  }

  const hasHigh = recommendations.some((recommendation) => recommendation.severity === 'high');
  const hasMedium = recommendations.some((recommendation) => recommendation.severity === 'medium');
  const hasLow = recommendations.some((recommendation) => recommendation.severity === 'low');

  return recommendations.map((recommendation, index) => {
    if (!hasHigh && index === 0) {
      return {
        ...recommendation,
        severity: 'high' as const,
      };
    }

    if (!hasLow && index === recommendations.length - 1) {
      return {
        ...recommendation,
        severity: 'low' as const,
      };
    }

    if (!hasMedium && index === 1) {
      return {
        ...recommendation,
        severity: 'medium' as const,
      };
    }

    return recommendation;
  });
}

function hasSwotContent(swot: AiAnalysisResponse['swot']) {
  return Object.values(swot).some((items) => items.length > 0);
}

function hasAiContent(input: PartialAiAnalysisResponse) {
  return input.recommendations.length > 0 || hasSwotContent(input.swot);
}

function normalizeAiResponse(input: unknown): PartialAiAnalysisResponse {
  const root = input && typeof input === 'object' ? (input as Record<string, unknown>) : {};
  const nestedSource = getObjectField(root, ['result', 'output', 'analysis', 'data', 'response']);
  const source =
    nestedSource && typeof nestedSource === 'object'
      ? (nestedSource as Record<string, unknown>)
      : root;
  const rawRecommendations =
    getObjectField(source, [
      'recommendations',
      'recommendation',
      'actions',
      'items',
      'businessRecommendations',
      'marketingRecommendations',
      'prioritizedRecommendations',
    ]) ?? [];
  const recommendations = rebalanceRecommendationSeverity(
    coerceRecommendationList(rawRecommendations)
      .map((item, index) => {
        const recommendation =
          item && typeof item === 'object' ? (item as Record<string, unknown>) : {};
        const title = coerceString(
          getObjectField(recommendation, ['title', 'name', 'headline']),
          `Рекомендация ${index + 1}`,
          220,
        );
        const explanation = coerceString(
          getObjectField(recommendation, ['explanation', 'reason', 'description', 'why']),
          `Рекомендация основана на рассчитанных метриках и диагностике канала.`,
        );
        const suggestedAction = coerceString(
          getObjectField(recommendation, [
            'suggestedAction',
            'action',
            'nextStep',
            'recommendation',
          ]),
          'Проверьте канал, бюджет и качество трафика перед принятием решения.',
        );

        return {
          title,
          severity: normalizeSeverity(getObjectField(recommendation, ['severity', 'priority'])),
          category: normalizeCategory(getObjectField(recommendation, ['category', 'type', 'area'])),
          explanation: ensureMinLength(explanation, 'Проверьте влияние на ключевые метрики.'),
          suggestedAction: ensureMinLength(
            suggestedAction,
            'Зафиксируйте результат после проверки.',
          ),
          expectedImpact:
            coerceString(
              getObjectField(recommendation, ['expectedImpact', 'impact', 'effect']),
              '',
              220,
            ) || undefined,
        };
      })
      .slice(0, 5),
  );

  const rawSwot = getObjectField(source, ['swot', 'swotAnalysis', 'SWOT']);
  const swotSource =
    rawSwot && typeof rawSwot === 'object' ? (rawSwot as Record<string, unknown>) : source;

  const swot = aiSwotSchema.parse({
    strengths: coerceStringArray(getObjectField(swotSource, ['strengths', 'Strengths'])),
    weaknesses: coerceStringArray(getObjectField(swotSource, ['weaknesses', 'Weaknesses'])),
    opportunities: coerceStringArray(
      getObjectField(swotSource, ['opportunities', 'Opportunities']),
    ),
    threats: coerceStringArray(getObjectField(swotSource, ['threats', 'Threats', 'risks'])),
  });
  const parsedRecommendations = z.array(aiRecommendationSchema).max(5).parse(recommendations);
  const result = {
    recommendations: parsedRecommendations,
    swot,
  };

  if (!hasAiContent(result)) {
    throw new LlmFormatError('LLM response does not contain usable recommendations or SWOT');
  }

  return result;
}

function getModelCandidates() {
  return [...new Set([env.llmModel, ...env.llmFallbackModels])];
}

function buildRepairPrompt(content: string, errorMessage: string): ChatMessage[] {
  return [
    {
      role: 'system',
      content:
        'Ты JSON-normalizer. Исправь ответ аналитической LLM в строгий JSON по схеме. Ничего не добавляй вне JSON. Пиши все текстовые поля на русском языке.',
    },
    {
      role: 'user',
      content: JSON.stringify({
        task: 'Преобразуй invalidResponse в валидный JSON. Сохрани смысл рекомендаций и SWOT, но исправь ключи, длину строк, severity и category.',
        previousError: errorMessage,
        requiredSchema: {
          recommendations: [
            {
              title: 'string, 8-220 chars',
              severity: 'high | medium | low',
              category: 'growth | efficiency | risk | retention | data_quality',
              explanation: 'string, 20-800 chars',
              suggestedAction: 'string, 20-800 chars',
              expectedImpact: 'string, optional',
            },
          ],
          swot: {
            strengths: ['string'],
            weaknesses: ['string'],
            opportunities: ['string'],
            threats: ['string'],
          },
        },
        rules: [
          'recommendations: 3-5 пунктов',
          'используй разные severity: high, medium и low, если пунктов минимум 3',
          'если в исходном ответе нет SWOT, верни пустые массивы swot',
          'удали из всех строк служебные фразы модели: Oops, need to close JSON, rewrite final, markdown, schema',
          'в текстовых значениях не должно быть фигурных и квадратных скобок',
          'верни только JSON без markdown',
        ],
        invalidResponse: content.slice(0, 12_000),
      }),
    },
  ];
}

async function requestOpenAiCompatibleContent(
  model: string,
  messages: ChatMessage[],
  timeoutMs = 25_000,
) {
  const response = await fetch(`${getLlmBaseUrl()}/chat/completions`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${env.llmApiKey}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': 'http://127.0.0.1:5173',
      'X-Title': 'BusinessPulse',
    },
    body: JSON.stringify({
      model,
      messages,
      temperature: 0.2,
      max_tokens: 3500,
      response_format: {
        type: 'json_object',
      },
    }),
    signal: AbortSignal.timeout(timeoutMs),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new LlmHttpError(
      `LLM API failed with ${response.status}: ${errorText.slice(0, 400)}`,
      response.status,
    );
  }

  const payload = (await response.json()) as {
    choices?: Array<{
      message?: {
        content?: string;
      };
    }>;
  };
  const content = payload.choices?.[0]?.message?.content;

  if (!content) {
    throw new LlmFormatError('LLM API returned empty content');
  }

  return content;
}

async function requestOpenAiCompatibleJson(snapshot: AnalysisSnapshot, model: string) {
  const content = await requestOpenAiCompatibleContent(model, buildAiPrompt(snapshot));

  try {
    return normalizeAiResponse(JSON.parse(extractJsonObject(content)));
  } catch (error) {
    const repairContent = await requestOpenAiCompatibleContent(
      model,
      buildRepairPrompt(content, error instanceof Error ? error.message : 'Unknown format error'),
      15_000,
    );

    try {
      return normalizeAiResponse(JSON.parse(extractJsonObject(repairContent)));
    } catch (repairError) {
      throw new LlmFormatError(
        `LLM response format repair failed: ${
          repairError instanceof Error ? repairError.message : 'Unknown format error'
        }`,
      );
    }
  }
}

export async function enhanceAnalysisSnapshotWithAi(
  snapshot: AnalysisSnapshot,
): Promise<IAiEnhancementResult> {
  if (!env.llmApiKey) {
    return {
      snapshot,
      status: 'skipped',
      message: 'LLM API key is not configured; rule-based recommendations were used',
    };
  }

  try {
    const errors: string[] = [];
    let usedModel = env.llmModel;
    let aiResult: PartialAiAnalysisResponse | null = null;

    for (const model of getModelCandidates()) {
      try {
        aiResult = await requestOpenAiCompatibleJson(snapshot, model);
        usedModel = model;
        break;
      } catch (error) {
        errors.push(`${model}: ${error instanceof Error ? error.message : 'Unknown LLM error'}`);
      }
    }

    if (!aiResult) {
      throw new Error(errors.join(' | '));
    }

    const hasAiRecommendations = aiResult.recommendations.length > 0;
    const hasAiSwot = hasSwotContent(aiResult.swot);
    const recommendations = hasAiRecommendations
      ? aiResult.recommendations.map((recommendation) => ({
          title: recommendation.title,
          severity: recommendation.severity,
          category: recommendation.category,
          explanation: recommendation.explanation,
          evidence: {
            source: 'llm',
            provider: env.llmProvider,
            model: usedModel,
            expectedImpact: recommendation.expectedImpact ?? null,
          },
          suggestedAction: recommendation.suggestedAction,
        }))
      : snapshot.recommendations.items;

    return {
      snapshot: {
        ...snapshot,
        swotResults: hasAiSwot ? aiResult.swot : snapshot.swotResults,
        recommendations: {
          items: recommendations,
          generatedBy: hasAiRecommendations
            ? `llm:${env.llmProvider}:${usedModel}`
            : snapshot.recommendations.generatedBy,
        },
      },
      status: 'applied',
      message:
        hasAiRecommendations && hasAiSwot
          ? 'LLM recommendations and SWOT generated'
          : 'LLM analysis partially generated; missing sections were filled by rule-based engine',
      payload: {
        provider: env.llmProvider,
        model: usedModel,
        recommendationsCount: recommendations.length,
        recommendationsSource: hasAiRecommendations ? 'llm' : 'rule_based',
        swotSource: hasAiSwot ? 'llm' : 'rule_based',
      },
    };
  } catch (error) {
    return {
      snapshot,
      status: 'failed',
      message: 'LLM generation failed; rule-based recommendations were used',
      payload: {
        provider: env.llmProvider,
        model: env.llmModel,
        error: error instanceof Error ? error.message : 'Unknown LLM error',
      },
    };
  }
}
