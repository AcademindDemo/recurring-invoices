import { beforeEach, describe, expect, it } from 'vitest';
import type { Db } from '../db/client.ts';
import { createTestClient, createTestDb, createTestUser } from '../db/testing.ts';
import { parseForm } from '../forms.ts';
import {
	billingDate,
	createSchedule,
	getSchedule,
	scheduleInput,
	upcomingBillingDates,
	type ScheduleFormValues
} from './schedules.ts';

const formValues: ScheduleFormValues = {
	clientId: '1',
	intervalMonths: '1',
	firstBillingDate: '2027-01-31',
	taxRate: '19',
	notes: 'Monthly retainer',
	lines: [{ description: 'Design retainer', quantity: '1', unitPrice: '1500' }]
};

describe('scheduleInput', () => {
	it('parses a monthly schedule', () => {
		expect(parseForm(scheduleInput, formValues).data).toEqual({
			clientId: 1,
			intervalMonths: 1,
			firstBillingDate: '2027-01-31',
			taxRate: 1900,
			notes: 'Monthly retainer',
			lines: [{ description: 'Design retainer', quantity: 1, unitPrice: 150000 }]
		});
	});

	it('only takes monthly or yearly', () => {
		expect(parseForm(scheduleInput, { ...formValues, intervalMonths: '3' }).errors).toEqual({
			intervalMonths: ['Choose how often.']
		});
	});
});

describe('schedules', () => {
	let db: Db;
	let userId: string;
	let clientId: number;

	beforeEach(() => {
		db = createTestDb();
		userId = createTestUser(db).id;
		clientId = createTestClient(db, userId).id;
	});

	it('stores a schedule with its lines in order', () => {
		const { data } = parseForm(scheduleInput, {
			...formValues,
			clientId: String(clientId),
			lines: [
				{ description: 'Design retainer', quantity: '1', unitPrice: '1500' },
				{ description: 'Hosting', quantity: '1', unitPrice: '40' }
			]
		});
		const created = createSchedule(db, userId, data!);

		expect(getSchedule(db, userId, created.id)).toMatchObject({
			status: 'active',
			client: { name: 'Kauri Studio' },
			lines: [{ description: 'Design retainer' }, { description: 'Hosting', unitPrice: 4000 }]
		});
	});

	it('keeps other users’ schedules out', () => {
		const { data } = parseForm(scheduleInput, { ...formValues, clientId: String(clientId) });
		const created = createSchedule(db, userId, data!);
		const otherUserId = createTestUser(db, 'Tama Ngata').id;

		expect(getSchedule(db, otherUserId, created.id)).toBeUndefined();
	});
});

describe('billing dates', () => {
	const monthly = { firstBillingDate: '2027-01-31', intervalMonths: 1 };
	const yearly = { firstBillingDate: '2028-02-29', intervalMonths: 12 };

	it('counts monthly dates from the first billing date', () => {
		expect([0, 1, 2, 3, 4].map((n) => billingDate(monthly, n))).toEqual([
			'2027-01-31',
			'2027-02-28',
			'2027-03-31',
			'2027-04-30',
			'2027-05-31'
		]);
	});

	it('bills a yearly 29 February on 28 February until the next leap year', () => {
		expect([1, 2, 3, 4].map((n) => billingDate(yearly, n))).toEqual([
			'2029-02-28',
			'2030-02-28',
			'2031-02-28',
			'2032-02-29'
		]);
	});

	it('lists the next dates from a day', () => {
		expect(upcomingBillingDates(monthly, '2027-03-01', 3)).toEqual([
			'2027-03-31',
			'2027-04-30',
			'2027-05-31'
		]);
		expect(upcomingBillingDates(monthly, '2027-01-31', 1)).toEqual(['2027-01-31']);
	});
});
