import { and, asc, eq, inArray, lte, ne, sql, type SQL } from 'drizzle-orm';
import { z } from 'zod';
import { calculateTotals } from '../../invoices/totals.ts';
import { scheduleIntervals } from '../../schedules/interval.ts';
import type { Db } from '../db/client.ts';
import { recurringSchedule, recurringScheduleLine, type RecurringSchedule } from '../db/schema.ts';
import {
	formText,
	isoDateField,
	lineFormValues,
	linesField,
	taxRateField,
	type LineFormValues
} from '../forms.ts';
import { addDays, addMonths } from '../invoices/dates.ts';
import { accountsInTimeZone } from '../settings.ts';

export const scheduleInput = z.object({
	clientId: z.coerce.number<string>().int().positive('Choose a client.'),
	intervalMonths: z.coerce
		.number<string>()
		.pipe(z.literal(scheduleIntervals, { error: 'Choose how often.' })),
	firstBillingDate: isoDateField,
	taxRate: taxRateField,
	notes: z.string().trim(),
	lines: linesField
});

export type ScheduleInput = z.infer<typeof scheduleInput>;

export type ScheduleFormValues = {
	clientId: string;
	intervalMonths: string;
	firstBillingDate: string;
	taxRate: string;
	notes: string;
	lines: LineFormValues[];
};

export function scheduleFormValues(form: FormData): ScheduleFormValues {
	return {
		clientId: formText(form.get('clientId')),
		intervalMonths: formText(form.get('intervalMonths')),
		firstBillingDate: formText(form.get('firstBillingDate')),
		taxRate: formText(form.get('taxRate')),
		notes: formText(form.get('notes')),
		lines: lineFormValues(form)
	};
}

export function createSchedule(db: Db, userId: string, input: ScheduleInput) {
	return db.transaction((tx) => {
		const created = tx
			.insert(recurringSchedule)
			.values({
				userId,
				clientId: input.clientId,
				intervalMonths: input.intervalMonths,
				firstBillingDate: input.firstBillingDate,
				nextBillingOn: input.firstBillingDate,
				taxRate: input.taxRate,
				notes: input.notes || null
			})
			.returning()
			.get();

		tx.insert(recurringScheduleLine)
			.values(input.lines.map((line, position) => ({ scheduleId: created.id, position, ...line })))
			.run();

		return created;
	});
}

export function getSchedule(db: Db, userId: string, id: number) {
	return db.query.recurringSchedule
		.findFirst({
			where: and(eq(recurringSchedule.userId, userId), eq(recurringSchedule.id, id)),
			with: {
				client: true,
				lines: { orderBy: (line, { asc }) => asc(line.position) }
			}
		})
		.sync();
}

/** An account's schedules with their total per invoice: active ones billing soonest first, then paused, then ended. */
export function listSchedules(db: Db, userId: string) {
	return db.query.recurringSchedule
		.findMany({
			where: eq(recurringSchedule.userId, userId),
			with: { client: true, lines: true },
			orderBy: (schedule, { asc }) => [
				sql`case ${schedule.status} when 'active' then 0 when 'paused' then 1 else 2 end`,
				asc(schedule.nextBillingOn),
				asc(schedule.id)
			]
		})
		.sync()
		.map(({ lines, ...schedule }) => ({
			...schedule,
			total: calculateTotals(lines, schedule.taxRate).total
		}));
}

/** Stops an active schedule from billing until it is resumed. */
export function pauseSchedule(db: Db, userId: string, id: number) {
	return updateStatus(db, userId, id, eq(recurringSchedule.status, 'active'), {
		status: 'paused',
		nextBillingOn: null
	});
}

/** Bills a paused schedule again from its first billing date on or after `today`; dates missed while it was paused are skipped. */
export function resumeSchedule(db: Db, userId: string, id: number, today: string) {
	const schedule = getSchedule(db, userId, id);
	if (schedule?.status !== 'paused') return false;
	const [next] = upcomingBillingDates(schedule, today, 1);
	return updateStatus(db, userId, id, eq(recurringSchedule.status, 'paused'), {
		status: 'active',
		nextBillingOn: next
	});
}

/** Stops a schedule for good. */
export function endSchedule(db: Db, userId: string, id: number) {
	return updateStatus(db, userId, id, ne(recurringSchedule.status, 'ended'), {
		status: 'ended',
		nextBillingOn: null
	});
}

function updateStatus(
	db: Db,
	userId: string,
	id: number,
	from: SQL,
	to: Pick<RecurringSchedule, 'status' | 'nextBillingOn'>
) {
	const updated = db
		.update(recurringSchedule)
		.set(to)
		.where(and(eq(recurringSchedule.userId, userId), eq(recurringSchedule.id, id), from))
		.returning({ id: recurringSchedule.id })
		.get();
	return updated !== undefined;
}

/** The active schedules of the accounts in a time zone whose next billing date is on or before a date, soonest first. */
export function schedulesBillingBy(db: Db, date: string, timeZone: string) {
	return db
		.select()
		.from(recurringSchedule)
		.where(
			and(
				eq(recurringSchedule.status, 'active'),
				inArray(recurringSchedule.userId, accountsInTimeZone(db, timeZone)),
				lte(recurringSchedule.nextBillingOn, date)
			)
		)
		.orderBy(asc(recurringSchedule.nextBillingOn), asc(recurringSchedule.id))
		.all();
}

type BillingRule = Pick<RecurringSchedule, 'firstBillingDate' | 'intervalMonths'>;

/** The billing date `count` intervals after the first one; the first billing date is count 0. */
export function billingDate(schedule: BillingRule, count: number): string {
	return addMonths(schedule.firstBillingDate, count * schedule.intervalMonths);
}

/** The schedule's next billing dates on or after a date. */
export function upcomingBillingDates(schedule: BillingRule, from: string, count: number): string[] {
	const dates: string[] = [];
	for (let n = 0; dates.length < count; n++) {
		const date = billingDate(schedule, n);
		if (date >= from) dates.push(date);
	}
	return dates;
}

/** The schedule's billing dates from one day to another, both included. */
export function billingDatesBetween(schedule: BillingRule, from: string, to: string): string[] {
	const dates: string[] = [];
	for (let n = 0; billingDate(schedule, n) <= to; n++) {
		const date = billingDate(schedule, n);
		if (date >= from) dates.push(date);
	}
	return dates;
}

/** Moves a schedule's next billing date past a day whose invoices are sent. */
export function moveNextBillingDate(db: Db, schedule: RecurringSchedule, billedThrough: string) {
	const [next] = upcomingBillingDates(schedule, addDays(billedThrough, 1), 1);
	db.update(recurringSchedule)
		.set({ nextBillingOn: next })
		.where(eq(recurringSchedule.id, schedule.id))
		.run();
}
