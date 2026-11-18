# Codebase map

A newcomer's map of Fernbill's invoices, payments and background jobs: where things live, how they connect, and what to watch out for. Written 20 Oct 2026 at `c25f9af`; checks green then (svelte-check 0 errors, lint clean, 80 unit tests, 6 e2e tests).

## The shape of the app

- Requests: `src/routes/(app)/**/+page.server.ts` load data and run form actions. Each calls `requireUser()` (`src/lib/server/session.ts`), then a server function with `db` and `user.id`.
- Server code: `src/lib/server/`, one module per area. Every function takes `db` first, then the user id, and scopes its queries to that user.
- Shared code: `src/lib/` (money, totals, formatting, status labels) runs in the browser too, so the invoice form shows live totals with the same `calculateTotals` the server stores.
- Database: SQLite through Drizzle. `src/lib/server/db/schema.ts` is the source; `drizzle/0000_auth.sql` to `0007_settings_time_zone.sql` are generated from it. Tests run every migration on an in-memory database (`createTestDb()` in `db/testing.ts`).

## Invoices

- Tables: `invoice` (number, status, issue and due dates, currency, tax rate, totals in cents), `invoice_line` (position, description, quantity, unit price, amount).
- `src/lib/server/invoices/invoices.ts`: `invoiceInput` (zod), `createInvoice`, `updateDraft`, `deleteDraft`, `listInvoices`, `getInvoice` (with client, lines and payments).
- Totals: `calculateTotals` (`src/lib/invoices/totals.ts:14`) sums the line amounts and applies the tax rate to the subtotal, rounded once. Line amounts are `Math.round(quantity × unitPrice)`; quantities can be fractional.
- Numbering: `INV-2026-0001`, per user and per year of the issue date (`numbering.ts`). `createInvoice` picks the next sequence and inserts inside one transaction; a unique index on `(user_id, number_year, number_sequence)` backs it. `updateDraft` keeps the number even when the issue date moves to another year.
- Status: `draft → sent → paid`, or `sent → overdue → paid` (`src/lib/invoices/status.ts`). Only drafts can be edited, deleted or sent.
- Sending: `sendInvoice` (`send.ts:10`) emails the draft to the client's address, then marks it `sent` with `sentAt`. The mail goes out before the status changes.
- Currency is per account (`settings.currency`) and copied onto each invoice when it's created.

## Payments

- Table `payment`: amount in cents, `paid_on` date, method, note.
- `recordPayment` (`invoices/payments.ts:30`) accepts payments only on sent or overdue invoices, refuses more than the balance, and marks the invoice `paid` with `paidOn` when a payment covers the rest. Part payments leave it sent or overdue.
- The dashboard (`src/lib/server/dashboard.ts`) sums what's outstanding and what came in this month, per currency.

## Background jobs

- Table `job`: type, optional unique `key`, JSON payload, `run_at`, status, attempts, last error.
- `enqueue()` (`jobs/runner.ts:15`) inserts a job; with a `key` it's queued only once (`onConflictDoNothing`).
- `runDueJobs()` (`runner.ts:33`) claims due jobs oldest first and calls their handler. **A handler that throws is run again later from the start, up to 5 attempts**, waiting 5, 20, 80 and 320 minutes (`retryDelay`). Anything a handler did before it threw stays done, so handlers must be safe to run twice.
- Handlers are registered in `jobs/index.ts`; `enqueueDailyJobs` queues each daily job once per date with the key `<type>:<date>`. Today there is one: `mark-overdue`.
- `pnpm jobs:run` (`scripts/run-jobs.ts`) queues today's daily jobs and runs what's due, then exits; production starts it every five minutes from cron.

## Email

- `src/lib/server/email/index.ts` picks the mailer: in development it always writes JSON files to `.mail-preview/` (listed at `/dev/mail`); production uses SMTP when `MAIL_TRANSPORT=smtp`.
- `templates.ts` builds the invoice email's subject, text and inline-styled HTML.

## Dates and time zones

- Calendar dates are `YYYY-MM-DD` strings. `today(now, timeZone)` (`invoices/dates.ts`) is the date in a time zone. Pages use the account's `settings.timeZone` for the new invoice's issue and due dates, the default payment date and the dashboard's month; `mark-overdue` works out each account's date.
- `settings.timeZone` (an IANA name, default `UTC`) sets the account's dates and formats the "Sent" time (`formatTimestamp`).

## Worth knowing before changing things

- New tables or columns: edit `schema.ts`, then `pnpm db:generate --name <name>` and `pnpm db:migrate`. `package.json` also has `db:push`, which changes the database without a migration; the history only uses generated migrations.
- There is no single check command: CI runs `pnpm lint`, `pnpm check`, `pnpm test:unit --run` and `pnpm test:e2e`.
- Use the `now` a job gets, never `new Date()`, so tests can pin the time (AGENTS.md).
