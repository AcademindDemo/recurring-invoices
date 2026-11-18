import { describe, expect, it } from 'vitest';
import { formatMoney, parseMoney, toMoneyInput } from './money.ts';

describe('formatMoney', () => {
	it('formats cents in the given currency', () => {
		expect(formatMoney(123450, 'EUR')).toBe('€1,234.50');
		expect(formatMoney(99, 'GBP')).toBe('£0.99');
	});
});

describe('parseMoney', () => {
	it.each([
		['120', 12000],
		['120.5', 12050],
		['1,250.75', 125075],
		[' 0.99 ', 99]
	])('parses %j as %i cents', (input, cents) => {
		expect(parseMoney(input)).toBe(cents);
	});

	it.each(['', 'abc', '12.345', '-5', '1.2.3'])('rejects %j', (input) => {
		expect(parseMoney(input)).toBeUndefined();
	});
});

describe('toMoneyInput', () => {
	it('keeps two decimals', () => {
		expect(toMoneyInput(12000)).toBe('120.00');
	});
});
