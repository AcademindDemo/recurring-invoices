import { and, eq, max } from 'drizzle-orm';
import type { Queryable } from '../db/client.ts';
import { invoice } from '../db/schema.ts';

// Invoice numbers run per user and per calendar year of the issue date: INV-2026-0001, INV-2026-0002, …

export function formatInvoiceNumber(prefix: string, year: number, sequence: number): string {
	return `${prefix}-${year}-${String(sequence).padStart(4, '0')}`;
}

export function nextInvoiceSequence(db: Queryable, userId: string, year: number): number {
	const row = db
		.select({ last: max(invoice.numberSequence) })
		.from(invoice)
		.where(and(eq(invoice.userId, userId), eq(invoice.numberYear, year)))
		.get();
	return (row?.last ?? 0) + 1;
}
