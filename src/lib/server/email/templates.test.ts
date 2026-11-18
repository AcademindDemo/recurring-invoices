import { describe, expect, it } from 'vitest';
import type {
	Client,
	Invoice,
	InvoiceLine,
	RecurringSchedule,
	RecurringScheduleLine,
	Settings
} from '../db/schema.ts';
import { invoiceEmail, scheduleReminderEmail } from './templates.ts';

const invoice = {
	number: 'OD-2026-0007',
	currency: 'GBP',
	dueDate: '2026-04-15',
	total: 120000,
	notes: 'PO number 4471',
	lines: [
		{ description: 'Website <redesign>', quantity: 2, unitPrice: 60000, amount: 120000 }
	] as InvoiceLine[]
} as Invoice & { lines: InvoiceLine[] };
const client = { name: 'Harbour & Co' } as Client;
const settings = {
	businessName: 'Okafor Design',
	paymentInstructions: 'Sort code 00-00-00'
} as Settings;

describe('invoiceEmail', () => {
	it('names the invoice, amount and due date', () => {
		const mail = invoiceEmail({ invoice, client, settings });

		expect(mail.subject).toBe('Invoice OD-2026-0007 from Okafor Design');
		expect(mail.text).toContain('£1,200.00 due on 15 Apr 2026');
		expect(mail.text).toContain('Sort code 00-00-00');
	});

	it('includes the notes for the client', () => {
		const mail = invoiceEmail({ invoice, client, settings });

		expect(mail.text).toContain('PO number 4471');
		expect(mail.html).toContain('PO number 4471');
	});

	it('escapes what people typed in the HTML version', () => {
		const { html } = invoiceEmail({ invoice, client, settings });

		expect(html).toContain('Hello Harbour &amp; Co,');
		expect(html).toContain('Website &lt;redesign&gt;');
	});
});

describe('scheduleReminderEmail', () => {
	const schedule = {
		taxRate: 1900,
		client: { name: 'Harbour & Co' } as Client,
		lines: [
			{ description: 'Design retainer', quantity: 1, unitPrice: 150000 },
			{ description: 'Support hours', quantity: 2.5, unitPrice: 3333 }
		] as RecurringScheduleLine[]
	} as RecurringSchedule & { client: Client; lines: RecurringScheduleLine[] };
	const reminder = {
		schedule,
		billingDate: '2026-10-31',
		settings: { ...settings, currency: 'EUR' } as Settings,
		link: 'https://app.fernbill.com/schedules/7'
	};

	it('names the client, the billing date and the total with tax', () => {
		const mail = scheduleReminderEmail(reminder);

		expect(mail.subject).toBe('Harbour & Co is billed €1,884.16 on 31 Oct 2026');
		expect(mail.text).toContain('Support hours: 2.5 × €33.33');
	});

	it('links to the schedule', () => {
		const mail = scheduleReminderEmail(reminder);

		expect(mail.text).toContain('https://app.fernbill.com/schedules/7');
		expect(mail.html).toContain('href="https://app.fernbill.com/schedules/7"');
	});
});
