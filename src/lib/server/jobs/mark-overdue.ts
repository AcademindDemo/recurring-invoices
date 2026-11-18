import { and, eq, inArray, lt } from 'drizzle-orm';
import { invoice } from '../db/schema.ts';
import { today } from '../invoices/dates.ts';
import { accountsInTimeZone, accountTimeZones } from '../settings.ts';
import type { JobHandler } from './runner.ts';

/** Marks sent invoices as overdue once their due date has passed in their account's time zone. */
export const markOverdue: JobHandler = ({ db, now }) => {
	for (const timeZone of accountTimeZones(db)) {
		db.update(invoice)
			.set({ status: 'overdue' })
			.where(
				and(
					eq(invoice.status, 'sent'),
					inArray(invoice.userId, accountsInTimeZone(db, timeZone)),
					lt(invoice.dueDate, today(now, timeZone))
				)
			)
			.run();
	}
};
