/** How many months lie between a schedule's billing dates: monthly or yearly. */
export const scheduleIntervals = [1, 12] as const;

export function formatInterval(months: number): string {
	return months === 12 ? 'Every year' : 'Every month';
}
