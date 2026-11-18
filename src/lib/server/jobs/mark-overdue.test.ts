import { eq } from 'drizzle-orm';
import { beforeEach, describe, expect, it } from 'vitest';
import type { Db } from '../db/client.ts';
import { invoice, settings, type Invoice } from '../db/schema.ts';
import { createTestClient, createTestDb, createTestUser } from '../db/testing.ts';
import { createTestMailer } from '../email/testing.ts';
import { createInvoice, getInvoice } from '../invoices/invoices.ts';
import { createDefaultSettings } from '../settings.ts';
import { markOverdue } from './mark-overdue.ts';

describe('markOverdue', () => {
	let db: Db;
	let userId: string;
	let clientId: number;

	const invoiceDue = (
		dueDate: string,
		status: Invoice['status'],
		account = { userId, clientId }
	) => {
		const { id } = createInvoice(
			db,
			account.userId,
			{
				clientId: account.clientId,
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
	const statusOf = (id: number, owner = userId) => getInvoice(db, owner, id)?.status;
	const runOn = (now: string) =>
		markOverdue({
			db,
			mailer: createTestMailer(),
			origin: 'https://fernbill.test',
			payload: {},
			now: new Date(now)
		});

	beforeEach(() => {
		db = createTestDb();
		userId = createTestUser(db).id;
		createDefaultSettings(db, userId, 'Ana Silva');
		clientId = createTestClient(db, userId).id;
	});

	it('marks sent invoices overdue the day after they were due', async () => {
		const dueYesterday = invoiceDue('2026-07-01', 'sent');
		const dueToday = invoiceDue('2026-07-02', 'sent');

		await runOn('2026-07-02T09:00:00Z');

		expect(statusOf(dueYesterday)).toBe('overdue');
		expect(statusOf(dueToday)).toBe('sent');
	});

	it('leaves drafts and paid invoices alone', async () => {
		const draft = invoiceDue('2026-06-15', 'draft');
		const paid = invoiceDue('2026-06-15', 'paid');

		await runOn('2026-07-02T09:00:00Z');

		expect(statusOf(draft)).toBe('draft');
		expect(statusOf(paid)).toBe('paid');
	});

	it('marks invoices overdue by the date in their account’s time zone', async () => {
		const auckland = createTestUser(db, 'Mere Tane').id;
		createDefaultSettings(db, auckland, 'Kauri Studio');
		db.update(settings)
			.set({ timeZone: 'Pacific/Auckland' })
			.where(eq(settings.userId, auckland))
			.run();
		const dueInAuckland = invoiceDue('2026-10-13', 'sent', {
			userId: auckland,
			clientId: createTestClient(db, auckland, 'Harbour & Co').id
		});
		const dueInUtc = invoiceDue('2026-10-13', 'sent');

		// 11:30 on 14 October in Auckland, still 13 October in UTC
		await runOn('2026-10-13T22:30:00Z');

		expect(statusOf(dueInAuckland, auckland)).toBe('overdue');
		expect(statusOf(dueInUtc)).toBe('sent');
	});
});
