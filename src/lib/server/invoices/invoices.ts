import { and, asc, desc, eq, type SQL } from 'drizzle-orm';
import { z } from 'zod';
import { toMoneyInput } from '../../money.ts';
import type { InvoiceSort } from '../../invoices/sort.ts';
import type { InvoiceStatus } from '../../invoices/status.ts';
import { calculateTotals, lineAmount } from '../../invoices/totals.ts';
import type { Db } from '../db/client.ts';
import {
	formText,
	isoDateField,
	lineFormValues,
	linesField,
	taxRateField,
	type LineFormValues
} from '../forms.ts';
import { client, invoice, invoiceLine, type Invoice, type InvoiceLine } from '../db/schema.ts';
import { formatInvoiceNumber, nextInvoiceSequence } from './numbering.ts';

export const invoiceInput = z
	.object({
		clientId: z.coerce.number<string>().int().positive('Choose a client.'),
		issueDate: isoDateField,
		dueDate: isoDateField,
		taxRate: taxRateField,
		notes: z.string().trim(),
		lines: linesField
	})
	.refine((input) => input.dueDate >= input.issueDate, {
		path: ['dueDate'],
		message: 'The due date can’t be before the issue date.'
	});

export type InvoiceInput = z.infer<typeof invoiceInput>;

export type InvoiceFormValues = {
	clientId: string;
	issueDate: string;
	dueDate: string;
	taxRate: string;
	notes: string;
	lines: LineFormValues[];
};

export function invoiceFormValues(form: FormData): InvoiceFormValues {
	return {
		clientId: formText(form.get('clientId')),
		issueDate: formText(form.get('issueDate')),
		dueDate: formText(form.get('dueDate')),
		taxRate: formText(form.get('taxRate')),
		notes: formText(form.get('notes')),
		lines: lineFormValues(form)
	};
}

/** An invoice as values for the invoice form. */
export function toInvoiceFormValues(
	invoice: Invoice & { lines: InvoiceLine[] }
): InvoiceFormValues {
	return {
		clientId: String(invoice.clientId),
		issueDate: invoice.issueDate,
		dueDate: invoice.dueDate,
		taxRate: String(invoice.taxRate / 100),
		notes: invoice.notes ?? '',
		lines: invoice.lines.map((line) => ({
			description: line.description,
			quantity: String(line.quantity),
			unitPrice: toMoneyInput(line.unitPrice)
		}))
	};
}

const invoiceOrders: Record<InvoiceSort, SQL[]> = {
	newest: [desc(invoice.id)],
	due: [asc(invoice.dueDate), asc(invoice.id)],
	amount: [desc(invoice.total), desc(invoice.id)]
};

export type InvoiceFilter = {
	clientId?: number;
	status?: InvoiceStatus;
	sort?: InvoiceSort;
};

export function listInvoices(db: Db, userId: string, filter: InvoiceFilter = {}) {
	return db
		.select({
			id: invoice.id,
			number: invoice.number,
			status: invoice.status,
			issueDate: invoice.issueDate,
			dueDate: invoice.dueDate,
			currency: invoice.currency,
			total: invoice.total,
			clientName: client.name
		})
		.from(invoice)
		.innerJoin(client, eq(client.id, invoice.clientId))
		.where(
			and(
				eq(invoice.userId, userId),
				filter.clientId === undefined ? undefined : eq(invoice.clientId, filter.clientId),
				filter.status === undefined ? undefined : eq(invoice.status, filter.status)
			)
		)
		.orderBy(...invoiceOrders[filter.sort ?? 'newest'])
		.all();
}

export function getInvoice(db: Db, userId: string, id: number) {
	return db.query.invoice
		.findFirst({
			where: and(eq(invoice.userId, userId), eq(invoice.id, id)),
			with: {
				client: true,
				lines: { orderBy: (line, { asc }) => asc(line.position) },
				payments: { orderBy: (payment, { asc }) => [asc(payment.paidOn), asc(payment.id)] }
			}
		})
		.sync();
}

type CreateOptions = {
	prefix: string;
	currency: string;
	schedule?: { id: number; billingDate: string };
};

export function createInvoice(
	db: Db,
	userId: string,
	input: InvoiceInput,
	{ prefix, currency, schedule }: CreateOptions
) {
	const year = Number(input.issueDate.slice(0, 4));
	return db.transaction((tx) => {
		const sequence = nextInvoiceSequence(tx, userId, year);
		const created = tx
			.insert(invoice)
			.values({
				userId,
				clientId: input.clientId,
				number: formatInvoiceNumber(prefix, year, sequence),
				numberYear: year,
				numberSequence: sequence,
				issueDate: input.issueDate,
				dueDate: input.dueDate,
				currency,
				taxRate: input.taxRate,
				notes: input.notes || null,
				scheduleId: schedule?.id,
				billingDate: schedule?.billingDate,
				...calculateTotals(input.lines, input.taxRate)
			})
			.returning()
			.get();

		tx.insert(invoiceLine)
			.values(
				input.lines.map((line, position) => ({
					invoiceId: created.id,
					position,
					...line,
					amount: lineAmount(line)
				}))
			)
			.run();

		return created;
	});
}

/** Replaces a draft's details and lines. Returns undefined unless it is the user's draft. */
export function updateDraft(db: Db, userId: string, id: number, input: InvoiceInput) {
	return db.transaction((tx) => {
		const updated = tx
			.update(invoice)
			.set({
				clientId: input.clientId,
				issueDate: input.issueDate,
				dueDate: input.dueDate,
				taxRate: input.taxRate,
				notes: input.notes || null,
				...calculateTotals(input.lines, input.taxRate)
			})
			.where(and(eq(invoice.userId, userId), eq(invoice.id, id), eq(invoice.status, 'draft')))
			.returning()
			.get();
		if (!updated) return undefined;

		tx.delete(invoiceLine).where(eq(invoiceLine.invoiceId, id)).run();
		tx.insert(invoiceLine)
			.values(
				input.lines.map((line, position) => ({
					invoiceId: id,
					position,
					...line,
					amount: lineAmount(line)
				}))
			)
			.run();
		return updated;
	});
}

/** Deletes a draft. Returns whether there was one. */
export function deleteDraft(db: Db, userId: string, id: number) {
	const deleted = db
		.delete(invoice)
		.where(and(eq(invoice.userId, userId), eq(invoice.id, id), eq(invoice.status, 'draft')))
		.returning({ id: invoice.id })
		.get();
	return deleted !== undefined;
}
