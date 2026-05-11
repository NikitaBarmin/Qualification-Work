# Packages

## Зачем нужны пакеты
- `packages/contracts` держит общий договор между frontend и backend.
- `packages/constants` убирает дублирование системных строк, лимитов и справочников.
- `packages/analytics` выносит формулы и метаданные метрик в одно место.

## Какие проблемы они решают
- Убирают рассинхрон между фронтом и бэком.
- Не дают размазывать доменные сущности и формулы по разным слоям проекта.
- Снижают количество магических строк, ручных копий типов и дублирующейся бизнес-логики.

## Contracts
- Что хранит:
  - DTO и domain types для auth, datasets, analysis
  - структуры preview, mapping, snapshot
- Где будет использоваться:
  - backend: входы/выходы сервисов и контроллеров
  - frontend: типизация API-ответов, страниц, таблиц, карточек метрик
- Польза:
  - один контракт на обе стороны
  - меньше риска, что backend вернет одно, а frontend ждёт другое

## Constants
- Что хранит:
  - API routes
  - cookie names
  - upload limits
  - required dataset columns
  - metric ids и labels
- Где будет использоваться:
  - backend: middleware загрузки, auth, валидация файлов, роуты
  - frontend: роуты API, UI-лейблы, системные списки полей
- Польза:
  - один источник истины для фиксированных значений проекта

## Analytics
- Что хранит:
  - формулы метрик
  - ids и units метрик
  - метаданные и базовые threshold-конфиги
- Где будет использоваться:
  - backend: расчёт KPI, snapshot analysis, подготовка данных для AI
  - frontend: подписи метрик, units, интерпретация и отображение
- Польза:
  - формулы не размазываются по backend service и UI
  - изменение метрики происходит в одном месте

## Что уже настроено
- `analytics` покрыт unit-тестами на формулы.
- `contracts` сейчас намеренно оставлен без `zod` и служит как типовой пакет.
- Каждый пакет имеет свой `index.ts`, чтобы импортировать из одного entry point.

## Как использовать
- Импорт контрактов:
  - `import type { IAnalysisSnapshot } from '@businesspulse/contracts';`
- Импорт констант:
  - `import { API_ROUTES, REQUIRED_DATASET_COLUMNS } from '@businesspulse/constants';`
- Импорт аналитики:
  - `import { calculateRomi, METRIC_META } from '@businesspulse/analytics';`