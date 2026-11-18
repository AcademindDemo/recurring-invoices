# Changelog

## 1.0.0 – 29 October 2026

The first tagged release of Fernbill.

### Recurring invoices

- Set up a schedule for a client: what to bill, how often (every month or every year) and the first billing date. Later dates keep the first date's day of the month, or use the month's last day when it's shorter.
- Fernbill creates each invoice on its billing date and emails it to the client, numbered like any other invoice. Billing dates missed while Fernbill was down are caught up once each.
- Three days before each billing date, at 09:00 in your time zone, you get an email reminder with a link to the schedule.
- The Schedules page lists every schedule with its next billing date, total and status. Pause a schedule to skip billing dates, resume it from its next date, or end it; its invoices stay.
- An invoice from a schedule links back to it, and the schedule lists its invoices.

### Fixes

- Today's date follows each account's time zone: new invoices, overdue invoices and the dashboard's money received this month no longer use yesterday's date for accounts far ahead of UTC, like Pacific/Auckland.

### For developers

- `pnpm db:seed` fills an empty database with a demo account, four clients and invoices in every status.
- `pnpm verify` runs lint, type checks, unit and e2e tests, like CI.

### Also in this release

Everything Fernbill does so far: clients, invoices with line items and tax, sending them by email, payments and part payments, overdue invoices, the dashboard, business settings and printable invoices.
