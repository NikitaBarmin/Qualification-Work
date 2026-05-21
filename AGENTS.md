# AGENTS

## Product

- Russian-language BI platform for small business with a marketing focus.
- Main UX goal: maximum simplicity, low cognitive load, calm professional feel.
- Core flow: upload file, preview first 30 rows, map columns, edit data, run one analysis per upload, save final result.

## Frontend

- Stack: TypeScript, React, Vite, Redux Toolkit, RTK Query, FSD, Ant Design, SCSS Modules, Recharts, React Hook Form, Zod.
- API access: only through RTK Query.
- Global state only for truly shared data such as session, datasets, analyses, and upload draft flow.

## Backend

- Stack: Node.js, Express, TypeScript.
- Architecture: layered, but intentionally simple.
- Storage split:
  - SQLite for app state.
  - DuckDB in memory for analytics.

## Data

- Required columns:
  - Date
  - Channel
  - Spend
  - Traffic_Leads
  - New_Orders
  - Returning_Orders
  - Revenue
- Extra columns are allowed.
- Currency is rubles only.
- First Excel sheet only.
- Partial analysis is allowed when some required columns are missing.

## AI

- MVP priority: recommendations.
- AI chat exists only on the analysis page.
- AI stays within current analysis context.
- If AI fails, analysis can still be partially successful.

## Important Rules

- Frontend follows FSD.
- Backend follows layered architecture.
- Work in small iterations.
- Respect notes and project context before generating code.
