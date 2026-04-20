# Workspace

## Overview

pnpm workspace monorepo using TypeScript. Each package manages its own dependencies.

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **API framework**: Express 5
- **Database**: PostgreSQL + Drizzle ORM
- **Validation**: Zod (`zod/v4`), `drizzle-zod`
- **API codegen**: Orval (from OpenAPI spec)
- **Build**: esbuild (CJS bundle)
- **AI**: OpenAI (via Replit AI Integrations) - gpt-5.2 for chatbot + suggestions

## Key Commands

- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- `pnpm --filter @workspace/api-server run dev` — run API server locally

See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details.

## Artifacts

### Smart Scheduler (`artifacts/smart-scheduler`)
- **Type**: React + Vite web app
- **Preview path**: `/`
- **Description**: AI-powered smart scheduling PWA with chatbot interface

### API Server (`artifacts/api-server`)
- **Type**: Express 5 backend
- **Preview path**: `/api`
- **Routes**: `/api/events`, `/api/events/today`, `/api/events/upcoming`, `/api/events/stats`, `/api/chat/message`, `/api/chat/history`, `/api/suggestions`

## Database Tables

- `events` — Calendar events with title, description, startTime, endTime, date, category, priority, completed, color
- `chat_messages` — Chatbot message history with role (user/assistant), content, eventAction, eventId

## Features

- AI chatbot (powered by OpenAI gpt-5.2) for natural language scheduling via CRUD
- Traditional calendar view with month navigation
- Stats/analytics dashboard with category and priority breakdowns
- AI-generated scheduling suggestions
- Full event CRUD through both chatbot and UI
- Real-time progress tracking (today's events completion)
