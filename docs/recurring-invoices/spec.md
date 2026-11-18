# Recurring invoices

Issue 52. A business sets up a schedule for a client once, and Fernbill creates and sends that client's invoice on every billing date, with a reminder to the business three days before.

## Decisions

- A schedule bills one client the same lines, tax rate and notes, either every month or every year, from a first billing date.
- Its invoices are ordinary invoices: numbered in the normal sequence for their issue year, due after the account's payment terms, in the account's currency, emailed to the client like any other.
- Each invoice is sent on its billing date without a manual step. The reminder three days before is the business's chance to change the schedule or pause it.
- Changing a schedule changes future invoices only. Pausing skips the billing dates while paused; resuming continues with the next billing date from today. Ending is final and never touches invoices already sent.
- Only clients with an email address can have a schedule, because every scheduled invoice is emailed.
- Not in v1: prorating partial months (every invoice bills the full lines), skipping a single billing date (pausing and resuming covers it), schedules in another currency, weekly or quarterly schedules.

## Acceptance criteria

### Billing dates

- [ ] A monthly schedule bills on the first billing date's day of the month. When a month is shorter, it bills on that month's last day, and it goes back to the original day whenever the month has it: a schedule from 31 Jan 2027 bills on 28 Feb, 31 Mar, 30 Apr and 31 May 2027.
- [ ] February has 29 days in leap years: the same schedule bills on 29 Feb 2028.
- [ ] A yearly schedule from 29 Feb 2028 bills on 28 Feb 2029, 2030 and 2031, and on 29 Feb 2032.
- [ ] Billing dates are calendar dates (`YYYY-MM-DD`), like every other invoice date.

### Invoices from a schedule

- [ ] On a billing date, the schedule's invoice has that issue date, a due date after the account's payment terms, the next number for that year, and the schedule's lines, tax rate and notes.
- [ ] Its totals follow the team's rule: each line rounded to cents, tax on the subtotal, rounded once (`calculateTotals`). The schedule shows the same total its invoices will have.
- [ ] It is sent to the client and shows as sent, like an invoice sent by hand.
- [ ] The invoice links to its schedule, and the schedule lists its invoices.
- [ ] If Fernbill was down on a billing date, the invoice goes out once when it's back, never twice, even when a job is retried.

### Reminders

- [ ] Three days before each billing date of an active schedule, the business gets an email naming the client, the billing date, the lines and the total, with a link to the schedule.
- [ ] One reminder per billing date, however often the jobs run.

### Pause, resume, end

- [ ] A paused schedule creates no invoices and sends no reminders.
- [ ] Resuming bills on the next billing date from today; dates missed while paused are not billed.
- [ ] An ended schedule never bills again, and its invoices stay as they are.

## Milestones

1. **Schedules and the model.** The tables and migration, the billing-date rule with its tests, creating a schedule from a form, and issuing one schedule's invoice for one billing date.
2. **The generator job.** A daily job that bills every schedule that is due, catches up after downtime, and never bills twice.
3. **Reminder emails.** The reminder template and the job that sends it three days before.
4. **The UI.** The schedule list, a schedule's page with its invoices, pause, resume and end, and the link from an invoice to its schedule.

Each milestone keeps `pnpm lint`, `pnpm check`, `pnpm test` and `pnpm test:e2e` green and comes with tests for its criteria.

## Open questions

- Reminder timing (milestone 3): what time of day the reminder goes out, and in which time zone.
