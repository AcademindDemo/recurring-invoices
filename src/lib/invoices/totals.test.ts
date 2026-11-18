import { describe, expect, it } from 'vitest';
import { calculateTotals, formatTaxRate, lineAmount, parseTaxRate } from './totals.ts';

describe('calculateTotals', () => {
	it('sums lines and adds tax', () => {
		const lines = [
			{ quantity: 10, unitPrice: 9000 },
			{ quantity: 1, unitPrice: 25000 }
		];
		expect(calculateTotals(lines, 1900)).toEqual({ subtotal: 115000, tax: 21850, total: 136850 });
	});

	it('handles invoices without tax', () => {
		expect(calculateTotals([{ quantity: 2, unitPrice: 5000 }], 0)).toEqual({
			subtotal: 10000,
			tax: 0,
			total: 10000
		});
	});

	it('rounds fractional quantities to whole cents', () => {
		expect(lineAmount({ quantity: 1.5, unitPrice: 3333 })).toBe(5000);
		expect(calculateTotals([{ quantity: 1.5, unitPrice: 3333 }], 0).total).toBe(5000);
	});

	it('rounds tax once on the subtotal, not per line', () => {
		const lines = [
			{ quantity: 1, unitPrice: 250 },
			{ quantity: 1, unitPrice: 250 },
			{ quantity: 1, unitPrice: 250 }
		];
		// Per line, 19 % of €2.50 rounds up to 48 cents, three times: 144 instead of 143.
		expect(calculateTotals(lines, 1900)).toEqual({ subtotal: 750, tax: 143, total: 893 });
	});

	it('returns zero for no lines', () => {
		expect(calculateTotals([], 1900)).toEqual({ subtotal: 0, tax: 0, total: 0 });
	});
});

describe('tax rates', () => {
	it('parses percent input into basis points', () => {
		expect(parseTaxRate('19')).toBe(1900);
		expect(parseTaxRate('7.5')).toBe(750);
		expect(parseTaxRate('0')).toBe(0);
	});

	it('rejects values that are not a percentage', () => {
		expect(parseTaxRate('')).toBeUndefined();
		expect(parseTaxRate('abc')).toBeUndefined();
		expect(parseTaxRate('120')).toBeUndefined();
	});

	it('formats basis points as percent', () => {
		expect(formatTaxRate(1900)).toBe('19 %');
		expect(formatTaxRate(750)).toBe('7.5 %');
	});
});
