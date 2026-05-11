# Testing

## Зачем нужно
- `Vitest` покрывает unit и integration тесты быстро и нативно для TypeScript/Vite-стека.
- `React Testing Library` проверяет поведение интерфейса через сценарии пользователя, а не через внутренности компонентов.
- `Playwright` даёт e2e smoke-проверки в реальном браузере.
- `Coverage` нужен, чтобы видеть, какие части кода реально проверяются тестами.

## Что настроено
- `apps/frontend`: `Vitest` + `RTL` + `jsdom`
- `apps/backend`: `Vitest` в `node`-окружении
- `root`: `Playwright` для e2e

## Как пользоваться
- `pnpm test` — запустить unit/integration тесты по монорепе через Turbo
- `pnpm test:watch` — watch-режим для unit/integration тестов
- `pnpm test:coverage` — coverage-отчёты по пакетам, где он настроен
- `pnpm test:e2e` — e2e smoke-тесты через Playwright, перед запуском автоматически собирается frontend

## Где писать тесты
- frontend: `apps/frontend/src/**/*.test.ts(x)`
- backend: `apps/backend/test/**/*.test.ts`
- e2e: `tests/e2e/**/*.spec.ts`

## Базовый принцип
- unit: проверяем чистую логику и утилиты
- integration: проверяем связку модулей, API-слоя, форм, store и т.д.
- e2e: проверяем только ключевые пользовательские сценарии

## Примечание
- Для первого запуска `Playwright` может потребовать установку браузера: `pnpm exec playwright install chromium`
