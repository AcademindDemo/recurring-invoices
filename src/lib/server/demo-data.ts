import { hashPassword } from 'better-auth/crypto';
import { eq } from 'drizzle-orm';
import type { PaymentMethod } from '../invoices/payments.ts';
import { createClient } from './clients.ts';
import type { Db } from './db/client.ts';
import { account, invoice, settings, user } from './db/schema.ts';
import { addDays } from './invoices/dates.ts';
import { createInvoice } from './invoices/invoices.ts';
import { recordPayment } from './invoices/payments.ts';
import { createDefaultSettings } from './settings.ts';

/** The account the demo data belongs to. Only ever created in a local database. */
export const demoAccount = {
	name: 'Ana Silva',
	email: 'demo@fernbill.local',
	password: 'fernbill-demo',
	businessName: 'Ana Silva Design',
	timeZone: 'Europe/Berlin'
};

const clients = [
	{ name: 'Harbour & Co', email: 'accounts@harbour.example', address: '4 Quay Street, Bristol' },
	{ name: 'Linden Press', email: 'finance@lindenpress.example', address: '' },
	{
		name: 'Northlight Films',
		email: 'billing@northlight.example',
		address: 'Unit 2, 18 Mill Lane, Leeds'
	},
	{ name: 'Tidewater Café', email: 'hello@tidewater.example', address: '' }
];

type DemoInvoice = {
	client: number;
	daysAgo: number;
	lines: { description: string; quantity: number; unitPrice: number }[];
	status: 'draft' | 'sent' | 'overdue';
	payments?: { amount: number; daysAgo: number; method: PaymentMethod }[];
};

// Oldest first, so the numbers run in date order. Sent invoices are still within their 14 days;
// fully paid ones end up paid.
const invoices: DemoInvoice[] = [
	{
		client: 0,
		daysAgo: 100,
		lines: [{ description: 'Brand workshop', quantity: 1, unitPrice: 120000 }],
		status: 'sent',
		payments: [{ amount: 142800, daysAgo: 90, method: 'bank_transfer' }]
	},
	{
		client: 1,
		daysAgo: 85,
		lines: [
			{ description: 'Book cover design', quantity: 2, unitPrice: 65000 },
			{ description: 'Print-ready files', quantity: 1, unitPrice: 15000 }
		],
		status: 'sent',
		payments: [{ amount: 172550, daysAgo: 80, method: 'card' }]
	},
	{
		client: 3,
		daysAgo: 70,
		lines: [{ description: 'Menu redesign', quantity: 1, unitPrice: 48000 }],
		status: 'sent',
		payments: [{ amount: 57120, daysAgo: 58, method: 'bank_transfer' }]
	},
	{
		client: 2,
		daysAgo: 55,
		lines: [{ description: 'Title sequence', quantity: 1, unitPrice: 210000 }],
		status: 'overdue'
	},
	{
		client: 0,
		daysAgo: 40,
		lines: [{ description: 'Design retainer', quantity: 1, unitPrice: 150000 }],
		status: 'overdue',
		payments: [{ amount: 50000, daysAgo: 20, method: 'bank_transfer' }]
	},
	{
		client: 1,
		daysAgo: 12,
		lines: [{ description: 'Catalogue layout', quantity: 24, unitPrice: 4500 }],
		status: 'sent',
		payments: [{ amount: 60000, daysAgo: 4, method: 'card' }]
	},
	{
		client: 3,
		daysAgo: 8,
		lines: [{ description: 'Social media templates', quantity: 6, unitPrice: 9000 }],
		status: 'sent'
	},
	{
		client: 2,
		daysAgo: 3,
		lines: [
			{ description: 'Poster design', quantity: 1, unitPrice: 85000 },
			{ description: 'Revisions', quantity: 3, unitPrice: 7500 }
		],
		status: 'sent'
	},
	{
		client: 0,
		daysAgo: 0,
		lines: [{ description: 'Design retainer', quantity: 1, unitPrice: 150000 }],
		status: 'draft'
	},
	{
		client: 1,
		daysAgo: 0,
		lines: [{ description: 'Website illustrations', quantity: 8, unitPrice: 12000 }],
		status: 'draft'
	}
];

/**
 * Fills an empty database with the demo account, its clients and invoices in every status from the
 * last few months up to `today`. Refuses a database that already has accounts, so it can never
 * touch real data.
 */
export async function seedDemoData(db: Db, today: string) {
	const accounts = await db.$count(user);
	if (accounts > 0) {
		return {
			error: 'Demo data only goes into an empty database, and this one already has accounts.'
		};
	}

	const { id: userId } = db
		.insert(user)
		.values({
			id: crypto.randomUUID(),
			name: demoAccount.name,
			email: demoAccount.email,
			emailVerified: true
		})
		.returning()
		.get();
	db.insert(account)
		.values({
			id: crypto.randomUUID(),
			accountId: userId,
			providerId: 'credential',
			userId,
			password: await hashPassword(demoAccount.password)
		})
		.run();
	createDefaultSettings(db, userId, demoAccount.businessName);
	db.update(settings)
		.set({
			email: 'hello@anasilva.example',
			defaultTaxRate: 1900,
			timeZone: demoAccount.timeZone,
			paymentInstructions:
				'Bank transfer to DE89 3704 0044 0532 0130 00, quoting the invoice number.'
		})
		.where(eq(settings.userId, userId))
		.run();

	const clientIds = clients.map((input) => createClient(db, userId, input).id);

	for (const demo of invoices) {
		const issueDate = addDays(today, -demo.daysAgo);
		const { id } = createInvoice(
			db,
			userId,
			{
				clientId: clientIds[demo.client],
				issueDate,
				dueDate: addDays(issueDate, 14),
				taxRate: 1900,
				notes: '',
				lines: demo.lines
			},
			{ prefix: 'INV', currency: 'EUR' }
		);
		if (demo.status === 'draft') continue;

		db.update(invoice)
			.set({ status: 'sent', sentAt: new Date(`${issueDate}T09:00:00Z`) })
			.where(eq(invoice.id, id))
			.run();
		for (const payment of demo.payments ?? []) {
			recordPayment(db, userId, id, {
				amount: payment.amount,
				paidOn: addDays(today, -payment.daysAgo),
				method: payment.method,
				note: ''
			});
		}
		if (demo.status === 'overdue') {
			db.update(invoice).set({ status: 'overdue' }).where(eq(invoice.id, id)).run();
		}
	}

	return { userId, clients: clientIds.length, invoices: invoices.length };
}
