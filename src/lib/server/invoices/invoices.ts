import { and, asc, desc, eq, type SQL } from 'drizzle-orm';
import { z } from 'zod';
import { parseMoney, toMoneyInput } from '../../money.ts';
import type { InvoiceSort } from '../../invoices/sort.ts';
import type { InvoiceStatus } from '../../invoices/status.ts';
import { calculateTotals, lineAmount } from '../../invoices/totals.ts';
import type { Db } from '../db/client.ts';
import { taxRateField } from '../forms.ts';
import { client, invoice, invoiceLine, type Invoice, type InvoiceLine } from '../db/schema.ts';
import { formatInvoiceNumber, nextInvoiceSequence } from './numbering.ts';

const isoDate = z.iso.date({ error: 'Enter a date.' });

const lineInput = z.object({
	description: z.string().trim().min(1, 'Describe each line.'),
	quantity: z.coerce.number<string>().positive('Quantities must be above zero.'),
	unitPrice: z.string().transform((value, ctx) => {
		const cents = parseMoney(value);
		if (cents === undefined) {
			ctx.addIssue({ code: 'custom', message: 'Enter prices like 120 or 120.50.' });
			return z.NEVER;
		}
		return cents;
	})
});

export const invoiceInput = z
	.object({
		clientId: z.coerce.number<string>().int().positive('Choose a client.'),
		issueDate: isoDate,
		dueDate: isoDate,
		taxRate: taxRateField,
		notes: z.string().trim(),
		lines: z.array(lineInput).min(1, 'Add at least one line.')
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
	lines: { description: string; quantity: string; unitPrice: string }[];
};

/** The invoice form posts one description, quantity and unit price per line. */
export function invoiceFormValues(form: FormData): InvoiceFormValues {
	const text = (value: FormDataEntryValue | null | undefined) =>
		typeof value === 'string' ? value : '';
	const quantities = form.getAll('quantity');
	const unitPrices = form.getAll('unitPrice');
	return {
		clientId: text(form.get('clientId')),
		issueDate: text(form.get('issueDate')),
		dueDate: text(form.get('dueDate')),
		taxRate: text(form.get('taxRate')),
		notes: text(form.get('notes')),
		lines: form.getAll('description').map((description, i) => ({
			description: text(description),
			quantity: text(quantities[i]),
			unitPrice: text(unitPrices[i])
		}))
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

type NumberingOptions = { prefix: string; currency: string };

export function createInvoice(
	db: Db,
	userId: string,
	input: InvoiceInput,
	{ prefix, currency }: NumberingOptions
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
