import { verifyPassword } from 'better-auth/crypto';
import { eq } from 'drizzle-orm';
import { beforeEach, describe, expect, it } from 'vitest';
import { listClients } from './clients.ts';
import type { Db } from './db/client.ts';
import { account, invoice, payment, user } from './db/schema.ts';
import { createTestDb, createTestUser } from './db/testing.ts';
import { demoAccount, seedDemoData } from './demo-data.ts';

describe('seedDemoData', () => {
	let db: Db;

	beforeEach(() => {
		db = createTestDb();
	});

	it('creates a demo account you can sign in with', async () => {
		await seedDemoData(db, '2026-10-27');

		const demo = db.select().from(user).where(eq(user.email, demoAccount.email)).get()!;
		const login = db.select().from(account).where(eq(account.userId, demo.id)).get()!;
		expect(login.providerId).toBe('credential');
		expect(await verifyPassword({ hash: login.password!, password: demoAccount.password })).toBe(
			true
		);
	});

	it('adds clients and invoices in every status over the last few months', async () => {
		const result = await seedDemoData(db, '2026-10-27');
		if ('error' in result) throw new Error(result.error);

		expect(listClients(db, result.userId)).toHaveLength(4);
		const invoices = db.select().from(invoice).where(eq(invoice.userId, result.userId)).all();
		expect(new Set(invoices.map(({ status }) => status))).toEqual(
			new Set(['draft', 'sent', 'paid', 'overdue'])
		);
		const issueDates = invoices.map(({ issueDate }) => issueDate).sort();
		expect(issueDates.at(0)).toBe('2026-07-19');
		expect(issueDates.at(-1)).toBe('2026-10-27');
		const sent = invoices.filter(({ status }) => status === 'sent');
		expect(sent.every(({ dueDate }) => dueDate >= '2026-10-27')).toBe(true);

		const paidInvoiceIds = new Set(
			db
				.select()
				.from(payment)
				.all()
				.map(({ invoiceId }) => invoiceId)
		);
		const partPaid = invoices.filter(
			({ id, status }) => paidInvoiceIds.has(id) && status !== 'paid'
		);
		expect(partPaid.map(({ status }) => status).sort()).toEqual(['overdue', 'sent']);
	});

	it('refuses a database that already has an account', async () => {
		createTestUser(db);

		expect(await seedDemoData(db, '2026-10-27')).toEqual({
			error: 'Demo data only goes into an empty database, and this one already has accounts.'
		});
		expect(await db.$count(invoice)).toBe(0);
	});
});
