import { describe, expect, it } from 'vitest';
import { addDays, today } from './dates.ts';

describe('today', () => {
	it('returns the date as YYYY-MM-DD', () => {
		expect(today(new Date('2026-03-10T12:00:00Z'))).toBe('2026-03-10');
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
