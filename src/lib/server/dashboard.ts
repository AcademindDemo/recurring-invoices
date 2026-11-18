import { and, count, eq, inArray, like, sql, sum } from 'drizzle-orm';
import type { Db } from './db/client.ts';
import { invoice, payment } from './db/schema.ts';
import { today } from './invoices/dates.ts';
import { listInvoices } from './invoices/invoices.ts';

/** Money still owed on sent and overdue invoices, per currency, after part payments. */
export function outstandingTotals(db: Db, userId: string) {
	const paid = db
		.select({ invoiceId: payment.invoiceId, amount: sum(payment.amount).as('amount') })
		.from(payment)
		.groupBy(payment.invoiceId)
		.as('paid');

	return db
		.select({
			currency: invoice.currency,
			total: sql<number>`sum(${invoice.total} - coalesce(${paid.amount}, 0))`.mapWith(Number)
		})
		.from(invoice)
		.leftJoin(paid, eq(paid.invoiceId, invoice.id))
		.where(and(eq(invoice.userId, userId), inArray(invoice.status, ['sent', 'overdue'])))
		.groupBy(invoice.currency)
		.orderBy(invoice.currency)
		.all();
}

/** Payments received in a month (YYYY-MM), per currency. */
export function receivedInMonth(db: Db, userId: string, month: string) {
	return db
		.select({ currency: invoice.currency, total: sum(payment.amount).mapWith(Number) })
		.from(payment)
		.innerJoin(invoice, eq(invoice.id, payment.invoiceId))
		.where(and(eq(invoice.userId, userId), like(payment.paidOn, `${month}-%`)))
		.groupBy(invoice.currency)
		.orderBy(invoice.currency)
		.all();
}

export function countDrafts(db: Db, userId: string) {
	const [row] = db
		.select({ drafts: count() })
		.from(invoice)
		.where(and(eq(invoice.userId, userId), eq(invoice.status, 'draft')))
		.all();
	return row.drafts;
}

export function getDashboard(db: Db, userId: string, now = new Date()) {
	return {
		outstanding: outstandingTotals(db, userId),
		receivedThisMonth: receivedInMonth(db, userId, today(now).slice(0, 7)),
		drafts: countDrafts(db, userId),
		overdueInvoices: listInvoices(db, userId, { status: 'overdue', sort: 'due' }),
		recentInvoices: listInvoices(db, userId).slice(0, 5)
	};
}
