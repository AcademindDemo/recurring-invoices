import { eq } from 'drizzle-orm';
import { beforeEach, describe, expect, it } from 'vitest';
import type { Db } from '../db/client.ts';
import { recurringSchedule, settings } from '../db/schema.ts';
import { createTestClient, createTestDb, createTestUser } from '../db/testing.ts';
import { parseForm } from '../forms.ts';
import { createDefaultSettings } from '../settings.ts';
import {
	billingDate,
	billingDatesBetween,
	createSchedule,
	endSchedule,
	getSchedule,
	listSchedules,
	pauseSchedule,
	resumeSchedule,
	scheduleInput,
	schedulesBillingBy,
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

	it('bills first on the first billing date', () => {
		const { data } = parseForm(scheduleInput, { ...formValues, clientId: String(clientId) });

		expect(createSchedule(db, userId, data!).nextBillingOn).toBe('2027-01-31');
	});

	it('finds the active schedules that bill by a day in a time zone', () => {
		const scheduleFrom = (ownerId: string, ownerClientId: number, firstBillingDate: string) => {
			const { data } = parseForm(scheduleInput, {
				...formValues,
				clientId: String(ownerClientId),
				firstBillingDate
			});
			return createSchedule(db, ownerId, data!).id;
		};
		const otherUserId = createTestUser(db, 'Tama Ngata').id;
		const aucklandUserId = createTestUser(db, 'Mere Tane').id;
		createDefaultSettings(db, userId, 'Ana Silva Design');
		createDefaultSettings(db, otherUserId, 'Ngata Builds');
		createDefaultSettings(db, aucklandUserId, 'Kauri Studio');
		db.update(settings)
			.set({ timeZone: 'Pacific/Auckland' })
			.where(eq(settings.userId, aucklandUserId))
			.run();
		const january = scheduleFrom(userId, clientId, '2027-01-31');
		const february = scheduleFrom(otherUserId, createTestClient(db, otherUserId).id, '2027-02-15');
		const auckland = scheduleFrom(
			aucklandUserId,
			createTestClient(db, aucklandUserId).id,
			'2027-01-31'
		);
		const paused = scheduleFrom(userId, clientId, '2027-01-01');
		db.update(recurringSchedule)
			.set({ status: 'paused' })
			.where(eq(recurringSchedule.id, paused))
			.run();

		const ids = (date: string, timeZone: string) =>
			schedulesBillingBy(db, date, timeZone).map(({ id }) => id);
		expect(ids('2027-01-30', 'UTC')).toEqual([]);
		expect(ids('2027-01-31', 'UTC')).toEqual([january]);
		expect(ids('2027-02-15', 'UTC')).toEqual([january, february]);
		expect(ids('2027-01-31', 'Pacific/Auckland')).toEqual([auckland]);
	});

	it('lists the schedules billing soonest first, then paused and ended ones', () => {
		const scheduleFrom = (firstBillingDate: string) => {
			const { data } = parseForm(scheduleInput, {
				...formValues,
				clientId: String(clientId),
				firstBillingDate
			});
			return createSchedule(db, userId, data!).id;
		};
		const ended = scheduleFrom('2027-01-05');
		const later = scheduleFrom('2027-03-01');
		const paused = scheduleFrom('2027-01-10');
		const sooner = scheduleFrom('2027-02-01');
		endSchedule(db, userId, ended);
		pauseSchedule(db, userId, paused);
		createSchedule(
			db,
			createTestUser(db, 'Tama Ngata').id,
			parseForm(scheduleInput, { ...formValues, clientId: String(clientId) }).data!
		);

		expect(listSchedules(db, userId)).toMatchObject([
			{
				id: sooner,
				status: 'active',
				nextBillingOn: '2027-02-01',
				client: { name: 'Kauri Studio' }
			},
			{ id: later, status: 'active', nextBillingOn: '2027-03-01' },
			{ id: paused, status: 'paused', nextBillingOn: null },
			{ id: ended, status: 'ended', nextBillingOn: null }
		]);
	});

	it('resumes a paused schedule on its next billing date from today, skipping missed ones', () => {
		const { data } = parseForm(scheduleInput, { ...formValues, clientId: String(clientId) });
		const { id } = createSchedule(db, userId, data!);

		pauseSchedule(db, userId, id);
		expect(getSchedule(db, userId, id)).toMatchObject({ status: 'paused', nextBillingOn: null });

		resumeSchedule(db, userId, id, '2027-03-15');
		expect(getSchedule(db, userId, id)).toMatchObject({
			status: 'active',
			nextBillingOn: '2027-03-31'
		});
	});

	it('never brings an ended schedule back', () => {
		const { data } = parseForm(scheduleInput, { ...formValues, clientId: String(clientId) });
		const { id } = createSchedule(db, userId, data!);

		expect(endSchedule(db, userId, id)).toBe(true);
		expect(resumeSchedule(db, userId, id, '2027-03-15')).toBe(false);
		expect(pauseSchedule(db, userId, id)).toBe(false);
		expect(getSchedule(db, userId, id)).toMatchObject({ status: 'ended', nextBillingOn: null });
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

	it('lists every date that fell due between two days, for catching up', () => {
		expect(billingDatesBetween(monthly, '2027-02-01', '2027-04-30')).toEqual([
			'2027-02-28',
			'2027-03-31',
			'2027-04-30'
		]);
		expect(billingDatesBetween(monthly, '2027-01-31', '2027-01-31')).toEqual(['2027-01-31']);
		expect(billingDatesBetween(monthly, '2027-02-01', '2027-02-27')).toEqual([]);
	});
});
