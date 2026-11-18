// Runs the jobs that are due, then exits. Meant to be started every few minutes by cron or a
// scheduler: `pnpm jobs:run`. It runs outside SvelteKit, so it reads its settings from the
// environment with the app's schemas and only imports modules that don't depend on $app.
import { z } from 'zod';
import { variables } from '../src/env.ts';
import { createDb } from '../src/lib/server/db/client.ts';
import { createMailer } from '../src/lib/server/email/mailer.ts';
import { enqueueDailyJobs, handlers } from '../src/lib/server/jobs/index.ts';
import { runDueJobs } from '../src/lib/server/jobs/runner.ts';

const env = z
	.object({
		DATABASE_URL: z.string().min(1),
		ORIGIN: z.string().min(1),
		MAIL_TRANSPORT: variables.MAIL_TRANSPORT.schema,
		MAIL_FROM: variables.MAIL_FROM.schema,
		MAIL_PREVIEW_DIR: variables.MAIL_PREVIEW_DIR.schema,
		SMTP_HOST: variables.SMTP_HOST.schema,
		SMTP_PORT: variables.SMTP_PORT.schema,
		SMTP_USER: variables.SMTP_USER.schema,
		SMTP_PASSWORD: variables.SMTP_PASSWORD.schema
	})
	.parse(process.env);

const db = createDb(env.DATABASE_URL);
const now = new Date();
enqueueDailyJobs(db, now);
const services = { db, mailer: createMailer(env), origin: env.ORIGIN };
const { done, retried, failed } = await runDueJobs(services, handlers, now);
console.log(`Jobs: ${done} done, ${retried} to retry, ${failed} failed`);
