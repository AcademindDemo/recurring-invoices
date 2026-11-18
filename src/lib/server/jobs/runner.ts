import { and, asc, eq, lte, sql } from 'drizzle-orm';
import type { Db } from '../db/client.ts';
import { job, type Job } from '../db/schema.ts';
import type { Mailer } from '../email/mailer.ts';

export const MAX_ATTEMPTS = 5;
const FIRST_RETRY_DELAY_MS = 5 * 60_000;

/** What every handler can use: the database, the mailer and the app's public URL for links in mail. */
export type JobServices = { db: Db; mailer: Mailer; origin: string };
export type JobContext = JobServices & { payload: unknown; now: Date };
export type JobHandler = (context: JobContext) => void | Promise<void>;
export type JobHandlers = Record<string, JobHandler>;

type EnqueueOptions = { runAt?: Date; key?: string };

/** Queues a job. A job with a key is only ever queued once; queuing the same key again does nothing. */
export function enqueue(
	db: Db,
	type: string,
	payload: unknown = {},
	{ runAt = new Date(), key }: EnqueueOptions = {}
) {
	db.insert(job).values({ type, payload, runAt, key }).onConflictDoNothing().run();
}

/** How long to wait after a job's nth failed attempt: 5 minutes, then 20, 80 and 320. */
export function retryDelay(attempts: number): number {
	return FIRST_RETRY_DELAY_MS * 4 ** (attempts - 1);
}

/**
 * Runs every queued job that is due, oldest first. A job that throws is queued again, waiting
 * longer after each attempt, until it has failed MAX_ATTEMPTS times.
 */
export async function runDueJobs(services: JobServices, handlers: JobHandlers, now = new Date()) {
	const { db } = services;
	const summary = { done: 0, retried: 0, failed: 0 };

	for (let next = claimNext(db, now); next; next = claimNext(db, now)) {
		try {
			const handler = handlers[next.type];
			if (!handler) throw new Error(`No handler for job type "${next.type}"`);
			await handler({ ...services, payload: next.payload, now });
			update(db, next.id, { status: 'done', finishedAt: new Date() });
			summary.done++;
		} catch (error) {
			const lastError = error instanceof Error ? error.message : String(error);
			if (next.attempts < MAX_ATTEMPTS) {
				const runAt = new Date(now.getTime() + retryDelay(next.attempts));
				update(db, next.id, { status: 'queued', runAt, lastError });
				summary.retried++;
			} else {
				update(db, next.id, { status: 'failed', lastError, finishedAt: new Date() });
				summary.failed++;
			}
		}
	}

	return summary;
}

/** Takes the next due job off the queue and counts the attempt. */
function claimNext(db: Db, now: Date): Job | undefined {
	return db.transaction(
		(tx) => {
			const next = tx
				.select({ id: job.id })
				.from(job)
				.where(and(eq(job.status, 'queued'), lte(job.runAt, now)))
				.orderBy(asc(job.runAt), asc(job.id))
				.limit(1)
				.get();
			if (!next) return undefined;

			return tx
				.update(job)
				.set({ status: 'running', attempts: sql`${job.attempts} + 1` })
				.where(eq(job.id, next.id))
				.returning()
				.get();
		},
		{ behavior: 'immediate' }
	);
}

function update(db: Db, id: number, values: Partial<Job>) {
	db.update(job).set(values).where(eq(job.id, id)).run();
}
