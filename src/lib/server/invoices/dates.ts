// Invoice dates are calendar dates stored as YYYY-MM-DD.

/** Today's date as YYYY-MM-DD. */
export function today(now = new Date()): string {
	return now.toISOString().slice(0, 10);
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
