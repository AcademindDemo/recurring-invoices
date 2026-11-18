import { and, eq } from 'drizzle-orm';
import type { Db } from '../db/client.ts';
import { invoice } from '../db/schema.ts';
import type { Mailer } from '../email/mailer.ts';
import { addDays } from '../invoices/dates.ts';
import { createInvoice } from '../invoices/invoices.ts';
import { sendInvoice } from '../invoices/send.ts';
import { getSettings } from '../settings.ts';
import { getSchedule } from './schedules.ts';

/**
 * Creates a schedule's invoice for one billing date and sends it to the client. Running it again
 * for the same date, as a retried job does, reuses that invoice and only sends it while it is a
 * draft.
 */
export async function issueScheduledInvoice(
	db: Db,
	mailer: Mailer,
	userId: string,
	scheduleId: number,
	billingDate: string
) {
	const issued =
		findScheduledInvoice(db, userId, scheduleId, billingDate) ??
		createScheduledInvoice(db, userId, scheduleId, billingDate);
	if (issued.status !== 'draft') return { invoice: issued };
	return sendInvoice(db, mailer, userId, issued.id);
}

function findScheduledInvoice(db: Db, userId: string, scheduleId: number, billingDate: string) {
	return db.query.invoice
		.findFirst({
			where: and(
				eq(invoice.userId, userId),
				eq(invoice.scheduleId, scheduleId),
				eq(invoice.billingDate, billingDate)
			)
		})
		.sync();
}

function createScheduledInvoice(db: Db, userId: string, scheduleId: number, billingDate: string) {
	const schedule = getSchedule(db, userId, scheduleId);
	if (!schedule) throw new Error(`No schedule ${scheduleId} for user ${userId}`);

	const settings = getSettings(db, userId);
	return createInvoice(
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
		{
			prefix: settings.invoicePrefix,
			currency: settings.currency,
			schedule: { id: scheduleId, billingDate }
		}
	);
}
