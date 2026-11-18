// Runs the jobs that are due, then exits. Meant to be started every few minutes by cron or a
// scheduler: `pnpm jobs:run`. It runs outside SvelteKit, so it reads its settings from the
// environment and only imports modules that don't depend on $app.
import { createDb } from '../src/lib/server/db/client.ts';
import { enqueueDailyJobs, handlers } from '../src/lib/server/jobs/index.ts';
import { runDueJobs } from '../src/lib/server/jobs/runner.ts';

const url = process.env.DATABASE_URL;
if (!url) throw new Error('DATABASE_URL is not set');

const db = createDb(url);
const now = new Date();
enqueueDailyJobs(db, now);
const { done, retried, failed } = await runDueJobs(db, handlers, now);
console.log(`Jobs: ${done} done, ${retried} to retry, ${failed} failed`);
