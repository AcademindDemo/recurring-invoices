# Fernbill

Invoicing for freelancers and small agencies. SvelteKit with Svelte 5, SQLite through Drizzle, Better Auth.

## Setup

Node 24 and pnpm.

```sh
pnpm install
cp .env.example .env    # set BETTER_AUTH_SECRET to any long random string
pnpm db:migrate
```

## Run

- `pnpm dev`: the app at http://localhost:5173. Mail never leaves your machine in dev; sent mail shows up at `/dev/mail`.
- `pnpm test`: unit tests (Vitest).
- `pnpm test:e2e`: Playwright against a fresh `e2e.db`.
- `pnpm jobs:run`: runs the background jobs that are due.
- `pnpm db:seed`: fills an empty `local.db` with a demo account (`demo@fernbill.local`, `fernbill-demo`) and invoices in every status.
- `pnpm verify`: everything CI runs (lint, types, unit tests, e2e). Run it before you push.

## Layout

- `src/lib/server/`: everything that touches the database or sends mail.
  - `db/`: Drizzle schema and client.
  - `invoices/`: numbering, dates, sending, payments.
  - `email/`: templates and the dev and SMTP mailers.
  - `jobs/`: the job runner and its jobs.
- `src/lib/`: code the browser uses too (money, formatting, totals, components).
- `src/routes/(app)/`: signed-in pages; `(auth)/` for sign-in and sign-up.
- `drizzle/`: migrations.
- `e2e/`: Playwright tests.

## Conventions

- Money is integer cents. Tax rates are basis points (1900 = 19 %). Format with `formatMoney`.
- Calendar dates (issue, due, paid on) are `YYYY-MM-DD` strings; moments are `Date`s. Today's date is `today(now, timeZone)` in the account's `settings.timeZone`, never the UTC date.
- Server functions take `db` first, then the user id, and every query is scoped to that user.
- Forms post to actions. The zod schema lives next to the server code; actions run `parseForm` and return `fail(400, { errors, values })`.
- Import from `#lib/...` with the `.ts` extension.
- Unit tests sit next to the code as `*.test.ts` and use `createTestDb()`, never `local.db`.
- Copy is British English and talks to the user as "you".

## Background jobs

- A job type is a handler in `src/lib/server/jobs/`, registered in `jobs/index.ts`.
- Handlers get `{ db, mailer, origin, payload, now }`. Use `now`, never `new Date()`, so tests can pin the time, and `origin` for links in mail.
- Queue jobs with `enqueue()`. Give a job a `key` when it must only ever be queued once, like `mark-overdue:2026-10-14`.
- A handler that throws runs again later, up to five attempts (see `retryDelay` in `runner.ts`).

## Database changes

- Change `src/lib/server/db/schema.ts`, then run `pnpm db:generate --name <what-changed>` and `pnpm db:migrate`. Commit the migration with the schema change.
- Never run `pnpm db:push`: it changes your `local.db` without a migration, so nobody else's database gets the change.
- Never edit a migration that is on `main`; add a new one.
