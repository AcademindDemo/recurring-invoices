import { eq } from 'drizzle-orm';
import { beforeEach, describe, expect, it } from 'vitest';
import type { Db } from '../db/client.ts';
import { invoice, type Invoice } from '../db/schema.ts';
import { createTestClient, createTestDb, createTestUser } from '../db/testing.ts';
import { createInvoice, getInvoice } from '../invoices/invoices.ts';
import { markOverdue } from './mark-overdue.ts';

describe('markOverdue', () => {
	let db: Db;
	let userId: string;
	let clientId: number;

	const invoiceDue = (dueDate: string, status: Invoice['status']) => {
		const { id } = createInvoice(
			db,
			userId,
			{
				clientId,
				issueDate: '2026-06-01',
				dueDate,
				taxRate: 0,
				notes: '',
				lines: [{ description: 'Retainer', quantity: 1, unitPrice: 100000 }]
			},
			{ prefix: 'INV', currency: 'EUR' }
		);
		db.update(invoice).set({ status }).where(eq(invoice.id, id)).run();
		return id;
	};
	const statusOf = (id: number) => getInvoice(db, userId, id)?.status;

	beforeEach(() => {
		db = createTestDb();
		userId = createTestUser(db).id;
		clientId = createTestClient(db, userId).id;
	});

	it('marks sent invoices overdue the day after they were due', async () => {
		const dueYesterday = invoiceDue('2026-07-01', 'sent');
		const dueToday = invoiceDue('2026-07-02', 'sent');

		await markOverdue({ db, payload: {}, now: new Date('2026-07-02T09:00:00Z') });

		expect(statusOf(dueYesterday)).toBe('overdue');
		expect(statusOf(dueToday)).toBe('sent');
	});

	it('leaves drafts and paid invoices alone', async () => {
		const draft = invoiceDue('2026-06-15', 'draft');
		const paid = invoiceDue('2026-06-15', 'paid');

		await markOverdue({ db, payload: {}, now: new Date('2026-07-02T09:00:00Z') });

		expect(statusOf(draft)).toBe('draft');
		expect(statusOf(paid)).toBe('paid');
	});
});
