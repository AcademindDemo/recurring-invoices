import { describe, expect, it } from 'vitest';
import { addDays, addMonths, today, zonedTime } from './dates.ts';

describe('today', () => {
	it('returns the date as YYYY-MM-DD', () => {
		expect(today(new Date('2026-03-10T12:00:00Z'), 'UTC')).toBe('2026-03-10');
	});

	it('is the date in the account’s time zone, not in UTC', () => {
		expect(today(new Date('2026-10-13T22:30:00Z'), 'Pacific/Auckland')).toBe('2026-10-14');
		expect(today(new Date('2026-10-14T02:00:00Z'), 'America/New_York')).toBe('2026-10-13');
	});
});

describe('addDays', () => {
	it('adds payment terms to a date', () => {
		expect(addDays('2026-03-10', 14)).toBe('2026-03-24');
	});

	it('crosses month and year ends', () => {
		expect(addDays('2026-02-20', 14)).toBe('2026-03-06');
		expect(addDays('2026-12-20', 30)).toBe('2027-01-19');
	});

	it('is not affected by daylight saving changes', () => {
		expect(addDays('2026-03-25', 7)).toBe('2026-04-01');
	});
});

describe('addMonths', () => {
	it('keeps the day of the month', () => {
		expect(addMonths('2027-01-15', 1)).toBe('2027-02-15');
		expect(addMonths('2027-11-15', 3)).toBe('2028-02-15');
	});

	it('bills the 31st on the last day of shorter months', () => {
		expect(addMonths('2027-01-31', 1)).toBe('2027-02-28');
		expect(addMonths('2027-01-31', 2)).toBe('2027-03-31');
		expect(addMonths('2027-01-31', 3)).toBe('2027-04-30');
		expect(addMonths('2027-01-31', 4)).toBe('2027-05-31');
	});

	it('uses 29 February in leap years', () => {
		expect(addMonths('2028-01-31', 1)).toBe('2028-02-29');
		expect(addMonths('2028-02-29', 12)).toBe('2029-02-28');
		expect(addMonths('2028-02-29', 48)).toBe('2032-02-29');
	});
});

describe('zonedTime', () => {
	it('is the moment a time of day happens in a time zone', () => {
		expect(zonedTime('2027-01-28', '09:00', 'Pacific/Auckland')).toEqual(
			new Date('2027-01-27T20:00:00Z')
		);
		expect(zonedTime('2027-01-28', '09:00', 'America/New_York')).toEqual(
			new Date('2027-01-28T14:00:00Z')
		);
		expect(zonedTime('2027-01-28', '09:00', 'UTC')).toEqual(new Date('2027-01-28T09:00:00Z'));
	});

	it('follows daylight saving time', () => {
		expect(zonedTime('2026-10-23', '09:00', 'Europe/Berlin')).toEqual(
			new Date('2026-10-23T07:00:00Z')
		);
		expect(zonedTime('2026-10-26', '09:00', 'Europe/Berlin')).toEqual(
			new Date('2026-10-26T08:00:00Z')
		);
	});
});
