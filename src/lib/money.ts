// Amounts are stored as integers in the currency's minor unit (cents).

export const LOCALE = 'en-GB';

export const currencies = ['EUR', 'GBP', 'USD', 'CHF', 'AUD', 'NZD', 'CAD'] as const;

export function formatMoney(cents: number, currency: string): string {
	return new Intl.NumberFormat(LOCALE, { style: 'currency', currency }).format(cents / 100);
}

/** Parses what people type into a price field, like `1,250` or `99.5`, into cents. */
export function parseMoney(input: string): number | undefined {
	const normalized = input.trim().replace(/[\s,]/g, '');
	if (!/^\d+(\.\d{1,2})?$/.test(normalized)) return undefined;
	return Math.round(Number(normalized) * 100);
}

/** Cents as a value for a price input, e.g. `1250.00`. */
export function toMoneyInput(cents: number): string {
	return (cents / 100).toFixed(2);
}
