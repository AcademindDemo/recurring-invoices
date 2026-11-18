import { eq } from 'drizzle-orm';
import { beforeEach, describe, expect, it } from 'vitest';
import type { Db } from '../db/client.ts';
import { invoice } from '../db/schema.ts';
import { createTestClient, createTestDb, createTestUser } from '../db/testing.ts';
import { createInvoice, getInvoice } from './invoices.ts';
import { balanceDue, recordPayment, type PaymentInput } from './payments.ts';

const payment = (amount: number): PaymentInput => ({
	amount,
	paidOn: '2026-04-20',
	method: 'bank_transfer',
	note: ''
});

describe('recordPayment', () => {
	let db: Db;
	let userId: string;
	let invoiceId: number;

	beforeEach(() => {
		db = createTestDb();
		userId = createTestUser(db).id;
		const clientId = createTestClient(db, userId).id;
		invoiceId = createInvoice(
			db,
			userId,
			{
				clientId,
				issueDate: '2026-04-02',
				dueDate: '2026-04-16',
				taxRate: 0,
				notes: '',
				lines: [{ description: 'Workshop', quantity: 1, unitPrice: 100000 }]
			},
			{ prefix: 'INV', currency: 'EUR' }
		).id;
		db.update(invoice).set({ status: 'sent' }).where(eq(invoice.id, invoiceId)).run();
	});

	it('keeps a partly paid invoice open', () => {
		recordPayment(db, userId, invoiceId, payment(40000));

		const updated = getInvoice(db, userId, invoiceId)!;
		expect(updated.status).toBe('sent');
		expect(balanceDue(updated.total, updated.payments)).toBe(60000);
	});

	it('marks the invoice paid on the day the last payment arrived', () => {
		recordPayment(db, userId, invoiceId, payment(40000));
		recordPayment(db, userId, invoiceId, { ...payment(60000), paidOn: '2026-04-24' });

		const updated = getInvoice(db, userId, invoiceId)!;
		expect(updated.status).toBe('paid');
		expect(updated.paidOn).toBe('2026-04-24');
		expect(balanceDue(updated.total, updated.payments)).toBe(0);
	});

	it('takes payments on overdue invoices', () => {
		db.update(invoice).set({ status: 'overdue' }).where(eq(invoice.id, invoiceId)).run();

		recordPayment(db, userId, invoiceId, payment(100000));

		expect(getInvoice(db, userId, invoiceId)?.status).toBe('paid');
	});

	it('refuses more than the balance due', () => {
		recordPayment(db, userId, invoiceId, payment(40000));

		expect(recordPayment(db, userId, invoiceId, payment(60001))).toEqual({
			error: 'That’s more than the €600.00 still due.'
		});
	});

	it('refuses payments on drafts', () => {
		db.update(invoice).set({ status: 'draft' }).where(eq(invoice.id, invoiceId)).run();

		expect(recordPayment(db, userId, invoiceId, payment(40000))).toEqual({
			error: 'Only sent invoices take payments.'
		});
	});

	it('refuses payments on another user’s invoice', () => {
		const otherUserId = createTestUser(db, 'Someone Else').id;

		expect(recordPayment(db, otherUserId, invoiceId, payment(40000))).toEqual({
			error: 'Only sent invoices take payments.'
		});
	});
});
