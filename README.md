# Fit Check

Personal closet inventory and outfit picker, built as a mobile-first PWA.

- Product plan and roadmap: [`docs/PLAN.md`](docs/PLAN.md)
- UI design brief: [`docs/DESIGN_BRIEF.md`](docs/DESIGN_BRIEF.md)

## Stack

Next.js 16 (App Router) · TypeScript · Tailwind CSS 4 · Drizzle ORM · Postgres (Neon in production, embedded PGlite locally) · Vitest

## Getting started

Requires Node.js 24 (pinned in `.tool-versions` for asdf).

```bash
npm install
cp .env.example .env.local   # then set APP_PASSWORD and SESSION_SECRET
npm run db:migrate           # creates the local database in ./.data/pglite
npm run dev
```

Open http://localhost:3000 and sign in with `APP_PASSWORD`.

To install on an iPhone, open the deployed URL in Safari, tap Share, then **Add to Home Screen**.

## Environment variables

| Variable         | Required          | Description                                                        |
|------------------|-------------------|--------------------------------------------------------------------|
| `APP_PASSWORD`   | Yes               | Password for the single app user                                   |
| `SESSION_SECRET` | Yes               | Signs session cookies; 32+ characters (`openssl rand -base64 48`)  |
| `DATABASE_URL`   | Production only   | Neon Postgres connection string; unset locally to use PGlite       |

## Scripts

| Script                | Description                                         |
|-----------------------|-----------------------------------------------------|
| `npm run dev`         | Start the dev server                                |
| `npm run build`       | Production build                                    |
| `npm test`            | Run unit tests                                      |
| `npm run typecheck`   | Generate route types and type-check                 |
| `npm run lint`        | Lint                                                |
| `npm run db:generate` | Generate a migration after editing `lib/db/schema.ts` |
| `npm run db:migrate`  | Apply migrations (Neon if `DATABASE_URL` is set, otherwise PGlite) |
| `npm run db:studio`   | Browse the database in Drizzle Studio               |

## Project structure

```
app/
  (app)/          authenticated screens with the tab bar (Today, Closet, Outfits, History, Settings)
  login/          sign-in page and auth Server Actions
  api/health/     database connectivity check
  manifest.ts     PWA manifest; icons are generated in pwa-icon/, icon.tsx, apple-icon.tsx
components/       shared UI
lib/
  auth/           password check, signed session cookies, requireSession()
  db/             Drizzle schema and client
drizzle/          generated SQL migrations (committed)
proxy.ts          redirects unauthenticated requests to /login
public/sw.js      service worker (offline fallback only; no data caching)
tests/            Vitest tests
```

## Authentication

Single user. `proxy.ts` redirects unauthenticated page requests to `/login`. Server Actions and route handlers that read or write data must also call `requireSession()` from `lib/auth/server.ts`, because the proxy alone is not a sufficient security boundary.
