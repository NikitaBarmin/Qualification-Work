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
};

const SEVERITY_ALIASES: Record<string, z.infer<typeof recommendationSeveritySchema>> = {
  critical: 'high',
  high: 'high',
  low: 'low',
  medium: 'medium',
  moderate: 'medium',
  normal: 'medium',
};

function getLlmBaseUrl() {
  if (env.llmProvider === 'groq') {
    return 'https://api.groq.com/openai/v1';
  }

  return 'https://openrouter.ai/api/v1';
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
    ruleBasedRecommendations: snapshot.recommendations.items.slice(0, 6),
    ruleBasedSwot: snapshot.swotResults,
  };
}

function buildAiPrompt(snapshot: AnalysisSnapshot) {
  return [
    {
      role: 'system',
      content:
        'Ты опытный BI и маркетинговый аналитик для малого бизнеса. Пиши только на русском языке. Не выдумывай факты, метрики, каналы, проценты и денежные суммы. Используй только предоставленный JSON-контекст. Верни строго валидный компактный JSON без markdown, комментариев, переносов внутри строк и текста вокруг JSON.',
    },
    {
      role: 'user',
      content: JSON.stringify({
        task: [
          'Сформируй 3-5 практичных рекомендаций для владельца малого бизнеса.',
          'Сформируй SWOT-анализ по тем же данным.',
          'Рекомендации должны быть короткими, применимыми и опираться на метрики.',
          'Если данных мало или есть проблемы качества, явно учитывай это в рекомендациях.',
          'Все строки должны быть на русском языке и не длиннее 180 символов.',
        ],
        outputSchema: {
          recommendations: [
            {
              title: 'string',
              severity: 'low | medium | high',
              category: 'growth | efficiency | risk | retention | data_quality',
              explanation: 'string',
              suggestedAction: 'string',
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
        context: buildAiContext(snapshot),
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

function coerceString(value: unknown, fallback: string, maxLength = 800) {
  const normalized = typeof value === 'string' ? value.trim() : '';
  const result = normalized || fallback;

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

function normalizeCategory(value: unknown): z.infer<typeof recommendationCategorySchema> {
  if (typeof value !== 'string') {
    return 'efficiency';
  }

  const normalized = value.trim() as z.infer<typeof recommendationCategorySchema>;
  const parsed = recommendationCategorySchema.safeParse(normalized);

  if (parsed.success) {
    return parsed.data;
  }

  return CATEGORY_ALIASES[value.trim()] ?? 'efficiency';
}

function normalizeSeverity(value: unknown): z.infer<typeof recommendationSeveritySchema> {
  if (typeof value !== 'string') {
    return 'medium';
  }

  return SEVERITY_ALIASES[value.trim().toLowerCase()] ?? 'medium';
}

function normalizeAiResponse(input: unknown) {
  const source = input && typeof input === 'object' ? (input as Record<string, unknown>) : {};
  const rawRecommendations =
    getObjectField(source, [
      'recommendations',
      'recommendation',
      'actions',
      'items',
      'businessRecommendations',
    ]) ?? [];
  const recommendations = (Array.isArray(rawRecommendations) ? rawRecommendations : [])
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
        getObjectField(recommendation, ['suggestedAction', 'action', 'nextStep', 'recommendation']),
        'Проверьте канал, бюджет и качество трафика перед принятием решения.',
      );

      return {
        title,
        severity: normalizeSeverity(getObjectField(recommendation, ['severity', 'priority'])),
        category: normalizeCategory(getObjectField(recommendation, ['category', 'type', 'area'])),
        explanation: ensureMinLength(explanation, 'Проверьте влияние на ключевые метрики.'),
        suggestedAction: ensureMinLength(suggestedAction, 'Зафиксируйте результат после проверки.'),
        expectedImpact:
          coerceString(
            getObjectField(recommendation, ['expectedImpact', 'impact', 'effect']),
            '',
            220,
          ) || undefined,
      };
    })
    .slice(0, 5);

  const rawSwot = getObjectField(source, ['swot', 'swotAnalysis', 'SWOT']);
  const swotSource =
    rawSwot && typeof rawSwot === 'object' ? (rawSwot as Record<string, unknown>) : source;

  return aiAnalysisResponseSchema.parse({
    recommendations,
    swot: {
      strengths: coerceStringArray(getObjectField(swotSource, ['strengths', 'Strengths'])),
      weaknesses: coerceStringArray(getObjectField(swotSource, ['weaknesses', 'Weaknesses'])),
      opportunities: coerceStringArray(
        getObjectField(swotSource, ['opportunities', 'Opportunities']),
      ),
      threats: coerceStringArray(getObjectField(swotSource, ['threats', 'Threats', 'risks'])),
    },
  });
}

function getModelCandidates() {
  return [...new Set([env.llmModel, ...env.llmFallbackModels])];
}

async function requestOpenAiCompatibleJson(snapshot: AnalysisSnapshot, model: string) {
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
      messages: buildAiPrompt(snapshot),
      temperature: 0.2,
      max_tokens: 3500,
      response_format: {
        type: 'json_object',
      },
    }),
    signal: AbortSignal.timeout(25_000),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`LLM API failed with ${response.status}: ${errorText.slice(0, 400)}`);
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
    throw new Error('LLM API returned empty content');
  }

  return normalizeAiResponse(JSON.parse(extractJsonObject(content)));
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
    let aiResult: z.infer<typeof aiAnalysisResponseSchema> | null = null;

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

    const recommendations = aiResult.recommendations.map((recommendation) => ({
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
    }));

    return {
      snapshot: {
        ...snapshot,
        swotResults: aiResult.swot,
        recommendations: {
          items: recommendations,
          generatedBy: `llm:${env.llmProvider}:${usedModel}`,
        },
      },
      status: 'applied',
      message: 'LLM recommendations and SWOT generated',
      payload: {
        provider: env.llmProvider,
        model: usedModel,
        recommendationsCount: recommendations.length,
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
