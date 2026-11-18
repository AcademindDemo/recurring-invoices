import { LOCALE } from './money.ts';

const dateFormat = new Intl.DateTimeFormat(LOCALE, {
	day: 'numeric',
	month: 'short',
	year: 'numeric',
	timeZone: 'UTC'
});

/** Formats a calendar date (YYYY-MM-DD), e.g. `2 Mar 2026`. */
export function formatDate(isoDate: string): string {
	return dateFormat.format(new Date(`${isoDate}T00:00:00Z`));
}

/** Formats a moment in the given IANA time zone, e.g. `2 Apr 2026, 15:05 BST`. */
export function formatTimestamp(date: Date, timeZone: string): string {
	return new Intl.DateTimeFormat(LOCALE, {
		day: 'numeric',
		month: 'short',
		year: 'numeric',
		hour: '2-digit',
		minute: '2-digit',
		timeZone,
		timeZoneName: 'short'
	}).format(date);
}
