import { eq } from 'drizzle-orm';
import { beforeEach, describe, expect, it } from 'vitest';
import type { Db } from '../db/client.ts';
import { job, recurringSchedule, settings } from '../db/schema.ts';
import { createTestClient, createTestDb, createTestUser } from '../db/testing.ts';
import { createTestMailer } from '../email/testing.ts';
import { createSchedule } from '../schedules/schedules.ts';
import { createDefaultSettings } from '../settings.ts';
import { handlers } from './index.ts';
import { runDueJobs, type JobServices } from './runner.ts';
import { queueScheduleReminders } from './schedule-reminders.ts';

describe('schedule reminders', () => {
	let db: Db;
	let services: JobServices & { mailer: ReturnType<typeof createTestMailer> };
	let userId: string;
	let scheduleId: number;

	const queueOn = (now: string) =>
		queueScheduleReminders({ ...services, payload: {}, now: new Date(now) });
	const reminders = () =>
		db
			.select({ key: job.key, runAt: job.runAt, status: job.status })
			.from(job)
			.where(eq(job.type, 'schedule-reminder'))
			.all();

	beforeEach(() => {
		db = createTestDb();
		services = { db, mailer: createTestMailer(), origin: 'https://fernbill.test' };
		userId = createTestUser(db).id;
		createDefaultSettings(db, userId, 'Ana Silva Design');
		db.update(settings)
			.set({ email: 'hello@anasilva.example', timeZone: 'Europe/Berlin' })
			.where(eq(settings.userId, userId))
			.run();
		scheduleId = createSchedule(db, userId, {
			clientId: createTestClient(db, userId).id,
			intervalMonths: 1,
			firstBillingDate: '2027-01-31',
			taxRate: 1900,
			notes: '',
			lines: [{ description: 'Design retainer', quantity: 1, unitPrice: 150000 }]
		}).id;
	});

	it('queues the reminder for 09:00 in the business’s time zone, three days before', async () => {
		await queueOn('2027-01-10T06:00:00Z');

		expect(reminders()).toEqual([
			{
				key: `schedule-reminder:${scheduleId}:2027-01-31`,
				runAt: new Date('2027-01-28T08:00:00Z'),
				status: 'queued'
			}
		]);
	});

	it('queues one reminder per billing date, however often it runs', async () => {
		await queueOn('2027-01-10T06:00:00Z');
		await queueOn('2027-01-11T06:00:00Z');

		expect(reminders()).toHaveLength(1);
	});

	it('skips a reminder whose time has already passed', async () => {
		await queueOn('2027-01-29T06:00:00Z');

		expect(reminders()).toEqual([]);
	});

	it('emails the business at the reminder time with a link to the schedule', async () => {
		await queueOn('2027-01-10T06:00:00Z');

		await runDueJobs(services, handlers, new Date('2027-01-28T07:59:00Z'));
		expect(services.mailer.sent).toEqual([]);

		await runDueJobs(services, handlers, new Date('2027-01-28T08:00:00Z'));
		expect(services.mailer.sent).toMatchObject([
			{ to: 'hello@anasilva.example', subject: 'Kauri Studio is billed €1,785.00 on 31 Jan 2027' }
		]);
		expect(services.mailer.sent[0].text).toContain(`https://fernbill.test/schedules/${scheduleId}`);
	});

	it('sends nothing for a schedule paused after its reminder was queued', async () => {
		await queueOn('2027-01-10T06:00:00Z');
		db.update(recurringSchedule)
			.set({ status: 'paused' })
			.where(eq(recurringSchedule.id, scheduleId))
			.run();

		await runDueJobs(services, handlers, new Date('2027-01-28T08:00:00Z'));

		expect(services.mailer.sent).toEqual([]);
		expect(reminders()).toMatchObject([{ status: 'done' }]);
	});
});
