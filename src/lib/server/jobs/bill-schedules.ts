import { today } from '../invoices/dates.ts';
import { issueScheduledInvoice } from '../schedules/issue.ts';
import {
	billingDatesBetween,
	moveNextBillingDate,
	schedulesBillingBy
} from '../schedules/schedules.ts';
import { accountTimeZones } from '../settings.ts';
import type { JobHandler } from './runner.ts';

/**
 * Sends the invoices of every active schedule whose billing date has come in its account's time
 * zone, including dates missed while Fernbill was down. A schedule moves on to its next billing date only once all of its due
 * invoices are sent, so a retry picks up where the last attempt failed.
 */
export const billSchedules: JobHandler = async ({ db, mailer, now }) => {
	for (const timeZone of accountTimeZones(db)) {
		const date = today(now, timeZone);
		for (const schedule of schedulesBillingBy(db, date, timeZone)) {
			for (const billingDate of billingDatesBetween(schedule, schedule.nextBillingOn!, date)) {
				await issueScheduledInvoice(db, mailer, schedule.userId, schedule.id, billingDate);
			}
			moveNextBillingDate(db, schedule, date);
		}
	}
};
