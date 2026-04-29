# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Purpose

Football statistics tracking, analysis, and match result/performance prediction dashboard. Goal is a data-driven, fast, and clean prediction UI.

## Tech Stack

- **Language & Framework:** TypeScript, Next.js 16 / React 19 (App Router)
- **Styling:** Tailwind CSS — dark theme dominant, minimalist dashboard inspired by "Godly.website"
- **Backend:** Supabase (`@supabase/supabase-js`, `@supabase/ssr`)
- **Football Data:** API-Football (primary data source)
- **Charts:** `recharts` (standalone) or `@tremor/react` — note `@tremor/react` was installed with `--legacy-peer-deps` due to React 18 peer dep; prefer `recharts` directly until Tremor releases React 19 support.

## Development Commands

```bash
npm run dev      # dev server (localhost:3000)
npm run build    # production build
npm run lint     # ESLint
```

## Architecture

Source lives under `src/` (App Router):
- **`src/app/`** — pages and layouts
- **`src/components/`** — football-focused UI components (stat tables, charts, prediction cards)
- **`src/lib/`** — API clients (API-Football integration), Supabase client, prediction logic
- **`src/types/`** — shared TypeScript types for match data, team stats, predictions

Code style: functional programming, modular, type-safe. All async operations (API calls, DB queries) must use try/catch with user-facing toast notifications on error.

## Working Principles

1. **Plan first:** Use `/plan` mode before complex data logic or UI changes.
2. **Visual verification:** Check stat tables and charts visually in browser after changes.
3. **Type safety:** Strict TypeScript — no `any`, define types for all football data models.
4. **Token efficiency:** Use `/compact` frequently during long sessions.

## Constraints

- Do not delete critical statistics files without explicit approval.
- Do not modify `.env` API keys (Supabase, API-Football) without asking.
- Respect `.claude/rules` files when they exist.