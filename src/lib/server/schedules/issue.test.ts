import { beforeEach, describe, expect, it } from 'vitest';
import type { Db } from '../db/client.ts';
import { createTestClient, createTestDb, createTestUser } from '../db/testing.ts';
import type { Mail, Mailer } from '../email/mailer.ts';
import { createInvoice, getInvoice, listInvoices } from '../invoices/invoices.ts';
import { createDefaultSettings } from '../settings.ts';
import { issueScheduledInvoice } from './issue.ts';
import { createSchedule } from './schedules.ts';

describe('issueScheduledInvoice', () => {
	let db: Db;
	let userId: string;
	let clientId: number;
	let scheduleId: number;
	let sent: Mail[];
	let failNextSend: boolean;
	const mailer: Mailer = {
		async send(mail) {
			if (failNextSend) {
				failNextSend = false;
				throw new Error('SMTP timeout');
			}
			sent.push(mail);
		}
	};

	beforeEach(() => {
		db = createTestDb();
		sent = [];
		failNextSend = false;
		userId = createTestUser(db).id;
		createDefaultSettings(db, userId, 'Ana Silva Design');
		clientId = createTestClient(db, userId).id;
		scheduleId = createSchedule(db, userId, {
			clientId,
			intervalMonths: 1,
			firstBillingDate: '2027-01-31',
			taxRate: 1900,
			notes: 'Monthly retainer',
			lines: [
				{ description: 'Design retainer', quantity: 1, unitPrice: 150000 },
				{ description: 'Support hours', quantity: 2.5, unitPrice: 3333 }
			]
		}).id;
	});

	it('creates the billing date’s invoice with the schedule’s lines and sends it', async () => {
		const result = await issueScheduledInvoice(db, mailer, userId, scheduleId, '2027-02-28');

		expect(getInvoice(db, userId, result.invoice!.id)).toMatchObject({
			number: 'INV-2027-0001',
			status: 'sent',
			issueDate: '2027-02-28',
			dueDate: '2027-03-14',
			currency: 'EUR',
			scheduleId,
			notes: 'Monthly retainer',
			lines: [{ description: 'Design retainer' }, { description: 'Support hours', amount: 8333 }]
		});
		expect(sent).toMatchObject([{ to: 'accounts@kauri.example' }]);
	});

	it('rounds tax once on the subtotal, like any invoice', async () => {
		const result = await issueScheduledInvoice(db, mailer, userId, scheduleId, '2027-02-28');

		expect(result.invoice).toMatchObject({ subtotal: 158333, tax: 30083, total: 188416 });
	});

	it('numbers its invoices in the normal sequence', async () => {
		await issueScheduledInvoice(db, mailer, userId, scheduleId, '2027-01-31');
		const second = await issueScheduledInvoice(db, mailer, userId, scheduleId, '2027-02-28');

		expect(second.invoice?.number).toBe('INV-2027-0002');
	});

	it('bills a date once when a retry runs it again after the email failed', async () => {
		failNextSend = true;
		await expect(
			issueScheduledInvoice(db, mailer, userId, scheduleId, '2027-01-31')
		).rejects.toThrow('SMTP timeout');

		const retried = await issueScheduledInvoice(db, mailer, userId, scheduleId, '2027-01-31');

		expect(listInvoices(db, userId)).toHaveLength(1);
		expect(retried.invoice).toMatchObject({ number: 'INV-2027-0001', status: 'sent' });
		expect(sent).toHaveLength(1);
	});

	it('lists the schedule’s invoices, newest first', async () => {
		await issueScheduledInvoice(db, mailer, userId, scheduleId, '2027-01-31');
		await issueScheduledInvoice(db, mailer, userId, scheduleId, '2027-02-28');
		createInvoice(
			db,
			userId,
			{
				clientId,
				issueDate: '2027-02-10',
				dueDate: '2027-02-24',
				taxRate: 1900,
				notes: '',
				lines: [{ description: 'Logo refresh', quantity: 1, unitPrice: 40000 }]
			},
			{ prefix: 'INV', currency: 'EUR' }
		);

		expect(listInvoices(db, userId, { scheduleId })).toMatchObject([
			{ number: 'INV-2027-0002', issueDate: '2027-02-28' },
			{ number: 'INV-2027-0001', issueDate: '2027-01-31' }
		]);
	});

	it('sends nothing when the date was already sent', async () => {
		await issueScheduledInvoice(db, mailer, userId, scheduleId, '2027-01-31');
		const again = await issueScheduledInvoice(db, mailer, userId, scheduleId, '2027-01-31');

		expect(again.invoice).toMatchObject({ number: 'INV-2027-0001', status: 'sent' });
		expect(sent).toHaveLength(1);
	});
});
