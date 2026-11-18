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
