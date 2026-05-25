# BusinessPulse

BusinessPulse is a Russian-language BI platform for small businesses with a focus on marketing analytics. The platform helps a user upload a CSV or Excel file, preview the first rows, map columns to business fields, edit draft data, run an analysis, and receive a final dashboard with KPI metrics, charts, SWOT, and recommendations.

The MVP is designed around a simple user flow: upload data, check structure, map columns, save the dataset draft, run one analysis, and review the result.

## Tech Stack

### Frontend

- TypeScript
- React
- Vite
- Redux Toolkit
- RTK Query
- React Router
- Ant Design
- SCSS Modules
- Recharts
- React Hook Form
- Zod

### Backend

- Node.js
- Express
- TypeScript
- SQLite for application state
- File storage for uploaded datasets
- Rule-based analytics pipeline
- Optional OpenAI-compatible LLM integration for AI recommendations

### Tooling

- pnpm workspaces
- Turbo
- Vitest
- Playwright
- Oxlint
- Prettier

## Project Structure

```text
apps/
  backend/      Express API, auth, uploads, datasets, analyses
  frontend/     React application
packages/
  analytics/    shared analytics helpers and formulas
  constants/    shared constants
  contracts/    shared API/domain contracts
  types/        shared types
  utils/        shared utilities
tests/
  e2e/          Playwright tests
docs/           project documentation
notes/          project notes
```

## Requirements

- Node.js 24.14.0 is recommended.
- Node.js 20 or newer is required by the project configuration.
- pnpm 9.15.0 is used as the package manager.

Check local versions:

```bash
node --version
pnpm --version
```

## Environment Variables

Create environment files before running the project locally.

Backend environment file:

```text
apps/backend/.env
```

Example backend configuration:

```env
HOST=127.0.0.1
PORT=3001
CORS_ORIGIN=http://127.0.0.1:5173
JWT_SECRET=replace-with-local-secret
LLM_PROVIDER=openrouter
LLM_API_KEY=
LLM_MODEL=nvidia/nemotron-3-nano-30b-a3b:free
LLM_FALLBACK_MODELS=openai/gpt-oss-20b:free
```

Frontend environment file:

```text
apps/frontend/.env
```

Example frontend configuration:

```env
VITE_API_BASE_URL=http://127.0.0.1:3001/api
```

AI recommendations are optional. If `LLM_API_KEY` is not configured or the provider request fails, the analysis can still be completed with rule-based recommendations.

## Installation

Install dependencies from the repository root:

```bash
pnpm install
```

## Available Scripts

Run frontend and backend in development mode:

```bash
pnpm dev
```

Build all workspace packages and applications:

```bash
pnpm build
```

Run TypeScript checks:

```bash
pnpm typecheck
```

Run linting:

```bash
pnpm lint
```

Run unit and integration tests:

```bash
pnpm test
```

Run Playwright end-to-end tests:

```bash
pnpm test:e2e
```

Format the repository:

```bash
pnpm format
```

Remove generated build, coverage, and cache artifacts:

```bash
pnpm clean
```

## Running Locally

Start the development environment:

```bash
pnpm dev
```

Default local URLs:

- Frontend: `http://127.0.0.1:5173`
- Backend API: `http://127.0.0.1:3001/api`

The frontend communicates with the backend only through RTK Query API modules.

## Core User Flow

1. Register or sign in.
2. Upload a CSV, XLS, or XLSX file.
3. Preview the first 30 rows.
4. Map source columns to platform fields:
   - `date`
   - `channel`
   - `spend`
   - `traffic_leads`
   - `new_orders`
   - `returning_orders`
   - `revenue`
5. Edit preview data if needed.
6. Save the dataset draft.
7. Run the analysis.
8. Open the analytics dashboard with KPI metrics, charts, SWOT, and recommendations.

## API Overview

| Method   | Route                                                | Description                        |
| -------- | ---------------------------------------------------- | ---------------------------------- |
| `GET`    | `/api/health`                                        | Health check                       |
| `POST`   | `/api/auth/register`                                 | Register user                      |
| `POST`   | `/api/auth/login`                                    | Sign in                            |
| `POST`   | `/api/auth/logout`                                   | Sign out                           |
| `GET`    | `/api/auth/me`                                       | Get current session                |
| `POST`   | `/api/uploads/preview`                               | Upload file and create preview     |
| `GET`    | `/api/datasets`                                      | List user datasets                 |
| `POST`   | `/api/datasets`                                      | Create dataset from upload session |
| `GET`    | `/api/datasets/:datasetId`                           | Get dataset details                |
| `DELETE` | `/api/datasets/:datasetId`                           | Delete dataset                     |
| `GET`    | `/api/datasets/:datasetId/download`                  | Download original dataset file     |
| `PATCH`  | `/api/datasets/:datasetId/versions/:versionId/draft` | Save mapping and edit patch        |
| `GET`    | `/api/analyses`                                      | List user analyses                 |
| `POST`   | `/api/analyses`                                      | Create and run analysis            |
| `GET`    | `/api/analyses/:analysisId`                          | Get analysis details               |

## Data and Analysis Notes

- Required analytical columns are `Date`, `Channel`, `Spend`, `Traffic_Leads`, `New_Orders`, `Returning_Orders`, and `Revenue`.
- Extra columns are allowed.
- The default currency is rubles.
- For Excel files, the first sheet is used.
- Partial analysis is allowed when some required fields are missing.
- AI failure does not block the full analysis flow. The backend falls back to rule-based recommendations.
- Uploaded files are stored on the backend filesystem, while application metadata and analysis snapshots are stored in SQLite.

## Production Build

Build the project:

```bash
pnpm build
```

Start the compiled backend:

```bash
pnpm --filter @businesspulse/backend start
```

Preview the built frontend:

```bash
pnpm --filter @businesspulse/frontend preview
```

For production deployment, configure environment variables explicitly and use a stable `JWT_SECRET`.

## Quality Checks

Recommended checks before publishing changes:

```bash
pnpm typecheck
pnpm lint
pnpm build
pnpm test
```

End-to-end tests can be run separately:

```bash
pnpm test:e2e
```

## MVP Limitations

- The analytics pipeline is intentionally simple and runs inside the backend service.
- User-facing analytics are generated per dataset version.
- AI chat is limited to analysis context in the product concept; the MVP currently focuses on generated recommendations.
- The project does not include Kubernetes, Helm, or Docker deployment manifests at this stage.
