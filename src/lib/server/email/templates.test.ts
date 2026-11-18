import { describe, expect, it } from 'vitest';
import type { Client, Invoice, InvoiceLine, Settings } from '../db/schema.ts';
import { invoiceEmail } from './templates.ts';

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
