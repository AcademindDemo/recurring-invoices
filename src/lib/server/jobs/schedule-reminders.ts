import { and, eq, isNotNull } from 'drizzle-orm';
import { z } from 'zod';
import { recurringSchedule, settings, user } from '../db/schema.ts';
import { scheduleReminderEmail } from '../email/templates.ts';
import { addDays, zonedTime } from '../invoices/dates.ts';
import { getSchedule } from '../schedules/schedules.ts';
import { getSettings } from '../settings.ts';
import { enqueue, type JobHandler } from './runner.ts';

/** Reminders go out at this time in the business's time zone, this many days before a billing date. */
const reminderTime = '09:00';
const daysBefore = 3;

const reminderPayload = z.object({
	userId: z.string(),
	scheduleId: z.number(),
	billingDate: z.string()
});

/** Queues the reminder for each active schedule's next billing date, once per date. */
export const queueScheduleReminders: JobHandler = ({ db, now }) => {
	const schedules = db
		.select({
			userId: recurringSchedule.userId,
			scheduleId: recurringSchedule.id,
			billingDate: recurringSchedule.nextBillingOn,
			timeZone: settings.timeZone
		})
		.from(recurringSchedule)
		.innerJoin(settings, eq(settings.userId, recurringSchedule.userId))
		.where(and(eq(recurringSchedule.status, 'active'), isNotNull(recurringSchedule.nextBillingOn)))
		.all();

	for (const { userId, scheduleId, billingDate, timeZone } of schedules) {
		const runAt = zonedTime(addDays(billingDate!, -daysBefore), reminderTime, timeZone);
		if (runAt < now) continue;
		enqueue(
			db,
			'schedule-reminder',
			{ userId, scheduleId, billingDate },
			{ runAt, key: `schedule-reminder:${scheduleId}:${billingDate}` }
		);
	}
};

/** Emails the business one reminder, unless the schedule was paused, ended or moved to another date. */
export const sendScheduleReminder: JobHandler = async ({ db, mailer, origin, payload }) => {
	const { userId, scheduleId, billingDate } = reminderPayload.parse(payload);
	const schedule = getSchedule(db, userId, scheduleId);
	if (schedule?.status !== 'active' || schedule.nextBillingOn !== billingDate) return;

	const account = getSettings(db, userId);
	const owner = db.select({ email: user.email }).from(user).where(eq(user.id, userId)).get()!;
	await mailer.send({
		to: account.email ?? owner.email,
		...scheduleReminderEmail({
			schedule,
			billingDate,
			settings: account,
			link: `${origin}/schedules/${scheduleId}`
		})
	});
};
