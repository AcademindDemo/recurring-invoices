import { and, eq } from 'drizzle-orm';
import { z } from 'zod';
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
import { addMonths } from '../invoices/dates.ts';

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
