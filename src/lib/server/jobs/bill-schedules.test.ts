import { eq } from 'drizzle-orm';
import { beforeEach, describe, expect, it } from 'vitest';
import type { Db } from '../db/client.ts';
import { recurringSchedule, settings } from '../db/schema.ts';
import { createTestClient, createTestDb, createTestUser } from '../db/testing.ts';
import type { Mailer } from '../email/mailer.ts';
import { createTestMailer } from '../email/testing.ts';
import { listInvoices } from '../invoices/invoices.ts';
import { createSchedule, getSchedule } from '../schedules/schedules.ts';
import { createDefaultSettings } from '../settings.ts';
import { billSchedules } from './bill-schedules.ts';

describe('billSchedules', () => {
	let db: Db;
	let userId: string;
	let scheduleId: number;
	let mailer: ReturnType<typeof createTestMailer>;

	const runOn = (now: string, using: Mailer = mailer) =>
		billSchedules({
			db,
			mailer: using,
			origin: 'https://fernbill.test',
			payload: {},
			now: new Date(now)
		});
	const issueDates = () => listInvoices(db, userId).map(({ issueDate }) => issueDate);
	const nextBillingOn = () => getSchedule(db, userId, scheduleId)?.nextBillingOn;

	beforeEach(() => {
		db = createTestDb();
		mailer = createTestMailer();
		userId = createTestUser(db).id;
		createDefaultSettings(db, userId, 'Ana Silva Design');
		scheduleId = createSchedule(db, userId, {
			clientId: createTestClient(db, userId).id,
			intervalMonths: 1,
			firstBillingDate: '2027-01-31',
			taxRate: 1900,
			notes: '',
			lines: [{ description: 'Design retainer', quantity: 1, unitPrice: 150000 }]
		}).id;
	});

	it('bills nothing before the first billing date', async () => {
		await runOn('2027-01-30T06:00:00Z');

		expect(issueDates()).toEqual([]);
		expect(nextBillingOn()).toBe('2027-01-31');
	});

	it('sends the invoice on its billing date and moves on to the next date', async () => {
		await runOn('2027-01-31T06:00:00Z');

		expect(issueDates()).toEqual(['2027-01-31']);
		expect(mailer.sent).toMatchObject([{ to: 'accounts@kauri.example' }]);
		expect(nextBillingOn()).toBe('2027-02-28');
	});

	it('bills on the billing date in the account’s time zone', async () => {
		db.update(settings)
			.set({ timeZone: 'Pacific/Auckland' })
			.where(eq(settings.userId, userId))
			.run();

		await runOn('2027-01-30T12:00:00Z');

		expect(issueDates()).toEqual(['2027-01-31']);
		expect(nextBillingOn()).toBe('2027-02-28');
	});

	it('catches up on billing dates missed while Fernbill was down, once each', async () => {
		await runOn('2027-03-02T06:00:00Z');
		await runOn('2027-03-02T07:00:00Z');

		expect(issueDates().sort()).toEqual(['2027-01-31', '2027-02-28']);
		expect(mailer.sent).toHaveLength(2);
		expect(nextBillingOn()).toBe('2027-03-31');
	});

	it('bills a date once when a retry runs after the email failed', async () => {
		const failing: Mailer = {
			async send() {
				throw new Error('SMTP timeout');
			}
		};
		await expect(runOn('2027-01-31T06:00:00Z', failing)).rejects.toThrow('SMTP timeout');
		await runOn('2027-01-31T06:05:00Z');

		expect(issueDates()).toEqual(['2027-01-31']);
		expect(mailer.sent).toHaveLength(1);
		expect(nextBillingOn()).toBe('2027-02-28');
	});

	it('leaves paused schedules alone', async () => {
		db.update(recurringSchedule)
			.set({ status: 'paused' })
			.where(eq(recurringSchedule.id, scheduleId))
			.run();

		await runOn('2027-01-31T06:00:00Z');

		expect(issueDates()).toEqual([]);
	});
});
