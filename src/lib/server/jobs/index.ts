import type { Db } from '../db/client.ts';
import { today } from '../invoices/dates.ts';
import { billSchedules } from './bill-schedules.ts';
import { markOverdue } from './mark-overdue.ts';
import { enqueue, type JobHandlers } from './runner.ts';
import { queueScheduleReminders, sendScheduleReminder } from './schedule-reminders.ts';

export const handlers: JobHandlers = {
	'mark-overdue': markOverdue,
	'bill-schedules': billSchedules,
	'queue-schedule-reminders': queueScheduleReminders,
	'schedule-reminder': sendScheduleReminder
};

/**
 * Job types queued once a day, in the order they run. Schedules bill before their reminders are
 * queued, so a schedule billed today gets its reminder for its next billing date.
 */
const daily = ['mark-overdue', 'bill-schedules', 'queue-schedule-reminders'];

/** Queues today's daily jobs, keyed by the UTC date, unless they are already queued. */
export function enqueueDailyJobs(db: Db, now = new Date()) {
	const date = today(now, 'UTC');
	for (const type of daily) enqueue(db, type, { date }, { runAt: now, key: `${type}:${date}` });
}
