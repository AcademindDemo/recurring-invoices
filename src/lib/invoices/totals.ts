export type LineAmounts = { quantity: number; unitPrice: number };

export type Totals = { subtotal: number; tax: number; total: number };

/** A line's amount in whole cents. Quantities can be fractional, like 1.5 hours. */
export function lineAmount(line: LineAmounts): number {
	return Math.round(line.quantity * line.unitPrice);
}

/**
 * Sums the lines and applies the tax rate (in basis points) to the subtotal, rounded once,
 * the way tax offices expect. All amounts in cents.
 */
export function calculateTotals(lines: LineAmounts[], taxRate: number): Totals {
	const subtotal = lines.reduce((sum, line) => sum + lineAmount(line), 0);
	const tax = Math.round((subtotal * taxRate) / 10_000);
	return { subtotal, tax, total: subtotal + tax };
}

/** `19` or `7.5` (percent, as typed) to basis points. */
export function parseTaxRate(input: string): number | undefined {
	const value = Number(input.trim());
	if (input.trim() === '' || !Number.isFinite(value) || value < 0 || value > 100) return undefined;
	return Math.round(value * 100);
}

export function formatTaxRate(basisPoints: number): string {
	return `${basisPoints / 100} %`;
}
