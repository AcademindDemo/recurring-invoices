import type { Db } from '../db/client.ts';
import { today } from '../invoices/dates.ts';
import { markOverdue } from './mark-overdue.ts';
import { enqueue, type JobHandlers } from './runner.ts';

export const handlers: JobHandlers = {
	'mark-overdue': markOverdue
};

/** Job types queued once a day. */
const daily = ['mark-overdue'];

/** Queues today's daily jobs unless they are already queued. */
export function enqueueDailyJobs(db: Db, now = new Date()) {
	const date = today(now);
	for (const type of daily) enqueue(db, type, { date }, { runAt: now, key: `${type}:${date}` });
}
