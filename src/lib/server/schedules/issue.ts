import type { Db } from '../db/client.ts';
import type { Mailer } from '../email/mailer.ts';
import { addDays } from '../invoices/dates.ts';
import { createInvoice } from '../invoices/invoices.ts';
import { sendInvoice } from '../invoices/send.ts';
import { getSettings } from '../settings.ts';
import { getSchedule } from './schedules.ts';

/** Creates a schedule's invoice for one billing date and sends it to the client. */
export async function issueScheduledInvoice(
	db: Db,
	mailer: Mailer,
	userId: string,
	scheduleId: number,
	billingDate: string
) {
	const schedule = getSchedule(db, userId, scheduleId);
	if (!schedule) throw new Error(`No schedule ${scheduleId} for user ${userId}`);

	const settings = getSettings(db, userId);
	const created = createInvoice(
		db,
		userId,
		{
			clientId: schedule.clientId,
			issueDate: billingDate,
			dueDate: addDays(billingDate, settings.paymentTermsDays),
			taxRate: schedule.taxRate,
			notes: schedule.notes ?? '',
			lines: schedule.lines.map(({ description, quantity, unitPrice }) => ({
				description,
				quantity,
				unitPrice
			}))
		},
		{ prefix: settings.invoicePrefix, currency: settings.currency, scheduleId }
	);
	return sendInvoice(db, mailer, userId, created.id);
}
