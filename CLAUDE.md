# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

@AGENTS.md

## Commands

```bash
npm run dev          # Start dev server (Next.js 16)
npm run build        # Production build
npm run lint         # ESLint
npx prisma migrate dev   # Run migrations (SQLite, uses prisma.config.ts for DATABASE_URL)
npx prisma generate      # Regenerate Prisma client (outputs to src/generated/prisma/)
npx tsx prisma/seed.ts   # Seed database
```

## Environment Variables

See `.env.example` for all variables. Key ones:

- `DATABASE_URL` — SQLite connection string (e.g., `file:./dev.db`)
- `SLACK_BOT_TOKEN` — Slack API token for channel sync
- `SLACK_CHANNEL_ID` — Default Slack channel to sync photos from
- `ADMIN_SECRET` — Secret for admin authentication
- `NEXT_PUBLIC_APP_URL` — Base URL for the app (default `http://localhost:3000`)

## Path Aliases

`@/*` maps to `./src/*` (configured in tsconfig.json).

## Architecture

This is a **Next.js 16 + React 19** photo contest app for a team trip. It syncs photos from a Slack channel, lets organizers score them, and displays a leaderboard.

**Data flow:** Slack channel → `/api/sync` (POST) → SQLite via Prisma → UI

### Key layers

- **`src/lib/slack.ts`** — Slack API integration. Fetches messages, threads, reactions, and user info. `syncSlackChannel()` is the main entry point that ingests everything into the DB.
- **`src/lib/scoring.ts`** — Scoring engine. Final score = weighted combination of normalized team votes (default 70%) and organizer scores (default 30%). `recomputeAllScores()` recalculates all entries.
- **`src/lib/db.ts`** — Singleton Prisma client with global caching for dev hot-reload.
- **`src/types/index.ts`** — Shared TypeScript interfaces and category constants.

### Data model (Prisma/SQLite)

`SlackPost` → has many `PhotoEntry` → has many `Reaction` and `UniqueVote`. A `User` is created from Slack user info on first encounter. `ScoringConfig` and `AppSettings` are singleton rows (id="default").

### API routes (`src/app/api/`)

- `sync` — POST triggers Slack channel sync + score recomputation
- `photos`, `photos/[id]`, `photos/[id]/score` — CRUD for photo entries and organizer scoring
- `leaderboard` — Ranked photo results
- `stats` — Dashboard aggregate stats
- `settings` — App configuration
- `seed` — Populate test data
- `demo-data` — Generate demo data
- `sync-logs` — Sync history

### Frontend

Client components using `framer-motion` for animations, `recharts` for charts, `react-masonry-css` for gallery layout. Tailwind CSS v4 for styling. Pages: dashboard (`/`), gallery (`/gallery`), leaderboard (`/leaderboard`), admin (`/admin`).

### Prisma

Uses Prisma 7 with `prisma.config.ts` for datasource configuration (not `schema.prisma` datasource URL). The generated client outputs to `src/generated/prisma/` — import from there, not `@prisma/client`. The `postinstall` script auto-runs `prisma generate`.
