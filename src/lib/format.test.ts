import { describe, expect, it } from 'vitest';
import { formatDate, formatTimestamp } from './format.ts';

describe('formatDate', () => {
	it('formats calendar dates without shifting the day', () => {
		expect(formatDate('2026-03-02')).toBe('2 Mar 2026');
		expect(formatDate('2026-12-31')).toBe('31 Dec 2026');
	});
});

describe('formatTimestamp', () => {
	it('formats moments in the given time zone', () => {
		const sentAt = new Date('2026-04-02T14:05:00Z');
		expect(formatTimestamp(sentAt, 'UTC')).toBe('2 Apr 2026, 14:05 UTC');
		expect(formatTimestamp(sentAt, 'Europe/London')).toBe('2 Apr 2026, 15:05 BST');
		expect(formatTimestamp(sentAt, 'Pacific/Auckland')).toBe('3 Apr 2026, 03:05 GMT+13');
	});
});
