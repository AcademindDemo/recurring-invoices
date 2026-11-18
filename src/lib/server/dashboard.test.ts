import { eq } from 'drizzle-orm';
import { beforeEach, describe, expect, it } from 'vitest';
import { getDashboard } from './dashboard.ts';
import type { Db } from './db/client.ts';
import { invoice } from './db/schema.ts';
import { createTestClient, createTestDb, createTestUser } from './db/testing.ts';
import { createInvoice, type InvoiceInput } from './invoices/invoices.ts';
import { recordPayment } from './invoices/payments.ts';

describe('getDashboard', () => {
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
			taxRate: 0,
			notes: '',
			lines: [{ description: 'Retainer', quantity: 1, unitPrice: 100000 }]
		};
	});

	it('sums what is owed per currency and counts drafts', () => {
		const create = (currency: string) =>
			createInvoice(db, userId, input, { prefix: 'INV', currency });
		const sent = [create('EUR'), create('EUR'), create('GBP')];
		create('EUR');
		for (const { id } of sent)
			db.update(invoice).set({ status: 'sent' }).where(eq(invoice.id, id)).run();

		expect(getDashboard(db, userId)).toMatchObject({
			outstanding: [
				{ currency: 'EUR', total: 200000 },
				{ currency: 'GBP', total: 100000 }
			],
			drafts: 1
		});
	});

	it('leaves part payments out of what is owed', () => {
		const { id } = createInvoice(db, userId, input, { prefix: 'INV', currency: 'EUR' });
		db.update(invoice).set({ status: 'sent' }).where(eq(invoice.id, id)).run();
		recordPayment(db, userId, id, {
			amount: 25000,
			paidOn: '2026-05-02',
			method: 'cash',
			note: ''
		});

		expect(getDashboard(db, userId).outstanding).toEqual([{ currency: 'EUR', total: 75000 }]);
	});

	it('sums the payments received this month', () => {
		const { id } = createInvoice(db, userId, input, { prefix: 'INV', currency: 'EUR' });
		db.update(invoice).set({ status: 'sent' }).where(eq(invoice.id, id)).run();
		const pay = (amount: number, paidOn: string) =>
			recordPayment(db, userId, id, { amount, paidOn, method: 'card', note: '' });
		pay(10000, '2026-04-30');
		pay(20000, '2026-05-02');
		pay(30000, '2026-05-14');

		const dashboard = getDashboard(db, userId, new Date('2026-05-18T12:00:00Z'));

		expect(dashboard.receivedThisMonth).toEqual([{ currency: 'EUR', total: 50000 }]);
	});

	it('starts empty', () => {
		expect(getDashboard(db, userId)).toEqual({
			outstanding: [],
			receivedThisMonth: [],
			drafts: 0,
			overdueInvoices: [],
			recentInvoices: []
		});
	});
});
