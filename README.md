# Fernbill

Invoicing for freelancers and small agencies: clients, invoices with line items and tax, and sending them by email.

> **Course checkpoint `start`.** Fernbill is the closing project of Academind's course _Claude Code: Fundamentals_, a fictional four-person team's invoicing app that is never deployed. In the course's last section you join the team and ship its top backlog item, recurring invoices. This tag is the repository as you find it on your first day, where Joining the Team (`ccf-join-the-team`) and Getting to Know the Codebase (`ccf-learn-the-codebase`) start. [Course checkpoints](#course-checkpoints) lists every tag.

## Getting started

You need Node 24 and pnpm.

```sh
pnpm install
cp .env.example .env    # then set BETTER_AUTH_SECRET
pnpm db:migrate
pnpm dev
```

Open http://localhost:5173 and create an account.

## Mail in development

Development never sends real mail. Sent invoices are written to `.mail-preview/` and listed at http://localhost:5173/dev/mail.

To send for real, build the app and set `MAIL_TRANSPORT=smtp` plus the `SMTP_*` variables (see `.env.example`).

## Background jobs

Work that doesn't belong in a request runs as a job: a row in the `job` table that `pnpm jobs:run` picks up. Today there is one, `mark-overdue`, queued once a day.

In production, start the runner every five minutes, e.g. with cron:

```cron
*/5 * * * * cd /srv/fernbill && pnpm jobs:run
```

A job that throws is retried after 5, 20, 80 and 320 minutes; after the fifth failed attempt it stays `failed` with its `last_error`. New job types go in `src/lib/server/jobs/` and get registered in `jobs/index.ts`.

## Tests

```sh
pnpm test        # unit tests
pnpm test:e2e    # Playwright, builds the app against a throwaway e2e.db
```

The first e2e run needs a browser: `pnpm exec playwright install chromium-headless-shell`.

## Course checkpoints

Each lecture of the closing section starts at one tag and ends at the next, so the diff between two tags is what that lecture did. Every tag is one commit, a clean recreation of the course's reference run, and installs and passes its checks as given.

| Tag          | What it adds                                                                                                                                                                           | Lecture that starts here                                                                             |
| ------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------- |
| `start`      | Fernbill as the team has it: clients, invoices with line items and tax, payments, sending by email, the job runner, unit and end-to-end tests, CI and the team's `AGENTS.md`           | Joining the Team (`ccf-join-the-team`), then Getting to Know the Codebase (`ccf-learn-the-codebase`) |
| `map`        | `docs/codebase-map.md`: invoices, payments and the job runner, mapped by Claude and checked against the code                                                                           | Writing a Spec and Milestones (`ccf-plan-recurring-invoices`)                                        |
| `spec`       | `docs/recurring-invoices/spec.md`: the acceptance criteria and four milestones                                                                                                         | Guardrails on a Team's Repo (`ccf-team-guardrails`)                                                  |
| `guardrails` | the database rule and `pnpm verify` in `AGENTS.md`; `.claude/settings.json` with the checks allowed, pushes asked, `.env` and `db:push` denied, and the `release-readiness` plugin     | Building Milestone 1 in the Terminal (`ccf-first-milestone`)                                         |
| `m1`         | milestone 1: the schedules migration, model, form and tests                                                                                                                            | Reviewing in the Desktop App (`ccf-review-in-desktop`)                                               |
| `review-1`   | the review fixes, merged as #53: schedules say "every month" and "every year", and a retried job bills each date once                                                                  | Splitting the Rest into a Project (`ccf-project-for-the-rest`)                                       |
| `threads`    | three more pull requests on `main`: each schedule's next billing date and a mailer for jobs (#54), today's date in each account's time zone (#58), demo data with `pnpm db:seed` (#59) | Reviewing and Merging the Threads (`ccf-review-the-threads`)                                         |
| `merged`     | the Project's three threads merged: the generator job (#55), the reminder emails (#56), the schedule list and its controls (#57)                                                       | Releasing Recurring Invoices (`ccf-ship-and-watch`)                                                  |
| `released`   | release 1.0.0 (#60): an end-to-end test of the recurring flow, `CHANGELOG.md` and the version number. You create the `v1.0.0` tag yourself                                             | none; Deciding How Much to Delegate (`ccf-hand-it-off`) looks back on it                             |

To follow a lecture from its start, clone the repository, switch to its tag on a branch of your own, here `spec`, and set up as in [Getting started](#getting-started):

```sh
git clone https://github.com/AcademindDemo/recurring-invoices.git fernbill
cd fernbill
git switch -c my-work spec
```

In the course, the team's plugin marketplace is a repository of its own, `fernbill/team-tools`. Here it is the `team-tools/` folder, and from `guardrails` on `.claude/settings.json` lists it by that path. Once you trust the folder in Claude Code, install the plugin with `claude plugin install release-readiness@team-tools --scope project`. Its JSON hook needs `jq`.

The threads' own branches aren't in this repository: `threads` is `main` before their pull requests, `merged` after.
