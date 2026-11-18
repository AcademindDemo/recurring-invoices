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

/** The moment a time of day (HH:MM) on a date happens in a time zone, like 09:00 in `Europe/Berlin`. */
export function zonedTime(isoDate: string, time: string, timeZone: string): Date {
	const asUtc = Date.parse(`${isoDate}T${time}:00Z`);
	const guess = asUtc - utcOffsetMs(new Date(asUtc), timeZone);
	return new Date(asUtc - utcOffsetMs(new Date(guess), timeZone));
}

function utcOffsetMs(at: Date, timeZone: string): number {
	const name = new Intl.DateTimeFormat('en-GB', { timeZone, timeZoneName: 'longOffset' })
		.formatToParts(at)
		.find(({ type }) => type === 'timeZoneName')!.value;
	const [, sign, hours, minutes] = /^GMT(?:([+-])(\d\d):(\d\d))?$/.exec(name)!;
	if (!sign) return 0;
	return (sign === '-' ? -1 : 1) * (Number(hours) * 60 + Number(minutes)) * 60_000;
}
