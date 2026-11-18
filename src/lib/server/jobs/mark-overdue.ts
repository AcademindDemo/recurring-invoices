import { and, eq, lt } from 'drizzle-orm';
import { invoice } from '../db/schema.ts';
import { today } from '../invoices/dates.ts';
import type { JobHandler } from './runner.ts';

/** Marks sent invoices as overdue once their due date has passed. */
export const markOverdue: JobHandler = ({ db, now }) => {
	db.update(invoice)
		.set({ status: 'overdue' })
		.where(and(eq(invoice.status, 'sent'), lt(invoice.dueDate, today(now))))
		.run();
};
