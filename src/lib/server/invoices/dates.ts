// Invoice dates are calendar dates stored as YYYY-MM-DD.

/** The date as YYYY-MM-DD in a time zone, like an account's `Pacific/Auckland`. */
export function today(now: Date, timeZone: string): string {
	return now.toLocaleDateString('en-CA', { timeZone });
}

export function addDays(isoDate: string, days: number): string {
	const date = new Date(`${isoDate}T00:00:00Z`);
	date.setUTCDate(date.getUTCDate() + days);
	return date.toISOString().slice(0, 10);
}

/** Moves a date by whole months, keeping its day or using the month's last day when the month is shorter. */
export function addMonths(isoDate: string, months: number): string {
	const date = new Date(`${isoDate}T00:00:00Z`);
	const day = date.getUTCDate();
	date.setUTCDate(1);
	date.setUTCMonth(date.getUTCMonth() + months);
	const lastDay = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + 1, 0)).getUTCDate();
	date.setUTCDate(Math.min(day, lastDay));
	return date.toISOString().slice(0, 10);
}
