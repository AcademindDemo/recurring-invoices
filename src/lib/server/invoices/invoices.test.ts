import { eq } from 'drizzle-orm';
import { beforeEach, describe, expect, it } from 'vitest';
import type { InvoiceSort } from '../../invoices/sort.ts';
import type { Db } from '../db/client.ts';
import { createTestClient, createTestDb, createTestUser } from '../db/testing.ts';
import { invoice } from '../db/schema.ts';
import {
	createInvoice,
	deleteDraft,
	getInvoice,
	invoiceInput,
	listInvoices,
	updateDraft,
	type InvoiceInput
} from './invoices.ts';

const options = { prefix: 'INV', currency: 'EUR' };

describe('invoices', () => {
	let db: Db;
	let userId: string;
	let input: InvoiceInput;

	beforeEach(() => {
		db = createTestDb();
		userId = createTestUser(db).id;
		input = {
			clientId: createTestClient(db, userId).id,
			issueDate: '2026-03-02',
			dueDate: '2026-03-16',
			taxRate: 1900,
			notes: '',
			lines: [
				{ description: 'Design workshop', quantity: 1, unitPrice: 80000 },
				{ description: 'Logo concepts', quantity: 3, unitPrice: 25000 }
			]
		};
	});

	it('creates an invoice with lines, totals and the next number', () => {
		const first = createInvoice(db, userId, input, options);
		const second = createInvoice(db, userId, input, options);

		expect(first).toMatchObject({
			number: 'INV-2026-0001',
			status: 'draft',
			subtotal: 155000,
			tax: 29450,
			total: 184450
		});
		expect(second.number).toBe('INV-2026-0002');

		const stored = getInvoice(db, userId, first.id);
		expect(stored?.client.name).toBe('Kauri Studio');
		expect(stored?.lines.map((line) => [line.description, line.amount])).toEqual([
			['Design workshop', 80000],
			['Logo concepts', 75000]
		]);
	});

	it('numbers by the year of the issue date', () => {
		const created = createInvoice(db, userId, { ...input, issueDate: '2027-01-04' }, options);
		expect(created.number).toBe('INV-2027-0001');
	});

	it('keeps numbering last year’s invoices after the new year starts', () => {
		const issue = (issueDate: string) =>
			createInvoice(db, userId, { ...input, issueDate, dueDate: issueDate }, options).number;

		expect(issue('2026-12-30')).toBe('INV-2026-0001');
		expect(issue('2027-01-04')).toBe('INV-2027-0001');
		expect(issue('2026-12-31')).toBe('INV-2026-0002');
		expect(issue('2027-01-05')).toBe('INV-2027-0002');
	});

	it('only shows invoices to their owner', () => {
		const created = createInvoice(db, userId, input, options);
		const other = createTestUser(db, 'Ben Carter').id;

		expect(getInvoice(db, other, created.id)).toBeUndefined();
		expect(listInvoices(db, other)).toEqual([]);
		expect(listInvoices(db, userId)).toHaveLength(1);
	});

	it('lists the invoices of one client', () => {
		const other = createTestClient(db, userId, 'Harbour Books').id;
		createInvoice(db, userId, input, options);
		createInvoice(db, userId, { ...input, clientId: other }, options);

		expect(listInvoices(db, userId, { clientId: other })).toMatchObject([
			{ number: 'INV-2026-0002', clientName: 'Harbour Books' }
		]);
	});

	it('lists the invoices with one status', () => {
		createInvoice(db, userId, input, options);
		const sent = createInvoice(db, userId, input, options);
		db.update(invoice).set({ status: 'sent' }).where(eq(invoice.id, sent.id)).run();

		expect(listInvoices(db, userId, { status: 'sent' })).toMatchObject([
			{ number: 'INV-2026-0002', status: 'sent' }
		]);
	});

	it('sorts by due date or amount', () => {
		const line = { description: 'Hosting', quantity: 1 };
		createInvoice(
			db,
			userId,
			{ ...input, dueDate: '2026-05-01', lines: [{ ...line, unitPrice: 300 }] },
			options
		);
		createInvoice(
			db,
			userId,
			{ ...input, dueDate: '2026-04-20', lines: [{ ...line, unitPrice: 100 }] },
			options
		);
		createInvoice(
			db,
			userId,
			{ ...input, dueDate: '2026-04-25', lines: [{ ...line, unitPrice: 900 }] },
			options
		);
		const numbers = (sort: InvoiceSort) =>
			listInvoices(db, userId, { sort }).map((row) => row.number.slice(-1));

		expect(numbers('newest')).toEqual(['3', '2', '1']);
		expect(numbers('due')).toEqual(['2', '3', '1']);
		expect(numbers('amount')).toEqual(['3', '1', '2']);
	});

	it('updates drafts and replaces their lines', () => {
		const created = createInvoice(db, userId, input, options);
		const lines = [{ description: 'Brand guidelines', quantity: 2, unitPrice: 40000 }];

		const updated = updateDraft(db, userId, created.id, { ...input, taxRate: 0, lines });

		expect(updated).toMatchObject({ number: 'INV-2026-0001', subtotal: 80000, total: 80000 });
		expect(getInvoice(db, userId, created.id)?.lines).toMatchObject([
			{ description: 'Brand guidelines', position: 0, amount: 80000 }
		]);
	});

	it('only changes and deletes drafts', () => {
		const created = createInvoice(db, userId, input, options);
		db.update(invoice).set({ status: 'sent' }).run();

		expect(updateDraft(db, userId, created.id, input)).toBeUndefined();
		expect(deleteDraft(db, userId, created.id)).toBe(false);
		expect(getInvoice(db, userId, created.id)?.lines).toHaveLength(2);
	});

	it('deletes drafts with their lines', () => {
		const created = createInvoice(db, userId, input, options);

		expect(deleteDraft(db, userId, created.id)).toBe(true);
		expect(getInvoice(db, userId, created.id)).toBeUndefined();
	});
});

describe('invoiceInput', () => {
	const valid = {
		clientId: '1',
		issueDate: '2026-03-02',
		dueDate: '2026-03-16',
		taxRate: '19',
		notes: '',
		lines: [{ description: 'Workshop', quantity: '1.5', unitPrice: '1,200.50' }]
	};

	it('parses form values', () => {
		expect(invoiceInput.parse(valid)).toEqual({
			clientId: 1,
			issueDate: '2026-03-02',
			dueDate: '2026-03-16',
			taxRate: 1900,
			notes: '',
			lines: [{ description: 'Workshop', quantity: 1.5, unitPrice: 120050 }]
		});
	});

	it('rejects a due date before the issue date', () => {
		const result = invoiceInput.safeParse({ ...valid, dueDate: '2026-03-01' });
		expect(result.error?.issues[0]?.path).toEqual(['dueDate']);
	});

	it('needs at least one line', () => {
		expect(invoiceInput.safeParse({ ...valid, lines: [] }).success).toBe(false);
	});
});
