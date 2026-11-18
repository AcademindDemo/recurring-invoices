import { eq } from 'drizzle-orm';
import { beforeEach, describe, expect, it } from 'vitest';
import type { Db } from '../db/client.ts';
import { client, settings } from '../db/schema.ts';
import { createTestClient, createTestDb, createTestUser } from '../db/testing.ts';
import type { Mail, Mailer } from '../email/mailer.ts';
import { createDefaultSettings } from '../settings.ts';
import { createInvoice, getInvoice } from './invoices.ts';
import { sendInvoice } from './send.ts';

describe('sendInvoice', () => {
	let db: Db;
	let userId: string;
	let clientId: number;
	let invoiceId: number;
	let sent: Mail[];
	const mailer: Mailer = {
		async send(mail) {
			sent.push(mail);
		}
	};

	beforeEach(() => {
		db = createTestDb();
		sent = [];
		userId = createTestUser(db).id;
		createDefaultSettings(db, userId, 'Ana Silva Design');
		clientId = createTestClient(db, userId).id;
		invoiceId = createInvoice(
			db,
			userId,
			{
				clientId,
				issueDate: '2026-04-02',
				dueDate: '2026-04-16',
				taxRate: 0,
				notes: '',
				lines: [{ description: 'Workshop', quantity: 1, unitPrice: 50000 }]
			},
			{ prefix: 'INV', currency: 'EUR' }
		).id;
	});

	it('emails the client and marks the invoice sent', async () => {
		const result = await sendInvoice(db, mailer, userId, invoiceId);

		expect(result.invoice).toMatchObject({ status: 'sent', sentAt: expect.any(Date) });
		expect(sent).toMatchObject([
			{ to: 'accounts@kauri.example', subject: 'Invoice INV-2026-0001 from Ana Silva Design' }
		]);
	});

	it('sends replies to the business email', async () => {
		db.update(settings)
			.set({ email: 'hello@anasilva.example' })
			.where(eq(settings.userId, userId))
			.run();

		await sendInvoice(db, mailer, userId, invoiceId);

		expect(sent[0].replyTo).toBe('hello@anasilva.example');
	});

	it('sends each invoice only once', async () => {
		await sendInvoice(db, mailer, userId, invoiceId);

		expect(await sendInvoice(db, mailer, userId, invoiceId)).toEqual({
			error: 'Only drafts can be sent.'
		});
		expect(sent).toHaveLength(1);
	});

	it('needs an email address for the client', async () => {
		db.update(client).set({ email: null }).where(eq(client.id, clientId)).run();

		expect(await sendInvoice(db, mailer, userId, invoiceId)).toEqual({
			error: 'Add an email address for Kauri Studio first.'
		});
		expect(getInvoice(db, userId, invoiceId)?.status).toBe('draft');
	});
});
