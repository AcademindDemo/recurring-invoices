import { and, eq, inArray, lt } from 'drizzle-orm';
import { invoice, settings } from '../db/schema.ts';
import { today } from '../invoices/dates.ts';
import type { JobHandler } from './runner.ts';

/** Marks sent invoices as overdue once their due date has passed in their account's time zone. */
export const markOverdue: JobHandler = ({ db, now }) => {
	const timeZones = db.selectDistinct({ timeZone: settings.timeZone }).from(settings).all();
	for (const { timeZone } of timeZones) {
		const accounts = db
			.select({ userId: settings.userId })
			.from(settings)
			.where(eq(settings.timeZone, timeZone));
		db.update(invoice)
			.set({ status: 'overdue' })
			.where(
				and(
					eq(invoice.status, 'sent'),
					inArray(invoice.userId, accounts),
					lt(invoice.dueDate, today(now, timeZone))
				)
			)
			.run();
	}
};
