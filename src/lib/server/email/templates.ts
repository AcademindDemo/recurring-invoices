import { formatDate } from '../../format.ts';
import { formatMoney } from '../../money.ts';
import type { Client, Invoice, InvoiceLine, Settings } from '../db/schema.ts';
import type { Mail } from './mailer.ts';

type InvoiceEmail = {
	invoice: Invoice & { lines: InvoiceLine[] };
	client: Client;
	settings: Settings;
};

export function invoiceEmail({ invoice, client, settings }: InvoiceEmail): Omit<Mail, 'to'> {
	const money = (cents: number) => formatMoney(cents, invoice.currency);
	const subject = `Invoice ${invoice.number} from ${settings.businessName}`;
	const due = `${money(invoice.total)} due on ${formatDate(invoice.dueDate)}`;

	const text = [
		`Hello ${client.name},`,
		`here is invoice ${invoice.number} from ${settings.businessName}: ${due}.`,
		invoice.lines
			.map((line) => `${line.description}: ${line.quantity} × ${money(line.unitPrice)}`)
			.join('\n'),
		`Total: ${money(invoice.total)}`,
		invoice.notes,
		settings.paymentInstructions,
		`Thank you,\n${settings.businessName}`
	]
		.filter(Boolean)
		.join('\n\n');

	const html = `<div style="${styles.body}">
<p>Hello ${escape(client.name)},</p>
<p>here is invoice <strong>${escape(invoice.number)}</strong> from ${escape(settings.businessName)}: ${due}.</p>
<table style="${styles.table}">
${invoice.lines
	.map(
		(line) =>
			`<tr><td style="${styles.cell}">${escape(line.description)}</td><td style="${styles.number}">${line.quantity} × ${money(line.unitPrice)}</td><td style="${styles.number}">${money(line.amount)}</td></tr>`
	)
	.join('\n')}
<tr><td colspan="2" style="${styles.total}">Total</td><td style="${styles.total}; text-align: right">${money(invoice.total)}</td></tr>
</table>
${paragraph(invoice.notes)}
${paragraph(settings.paymentInstructions)}
<p>Thank you,<br>${escape(settings.businessName)}</p>
</div>`;

	return { subject, text, html };
}

function paragraph(text: string | null) {
	return text ? `<p style="white-space: pre-line">${escape(text)}</p>` : '';
}

// Mail clients ignore stylesheets, so the HTML version carries inline styles.
const styles = {
	body: 'font-family: system-ui, sans-serif; font-size: 15px; line-height: 1.5; color: #1b2420',
	table: 'border-collapse: collapse; margin: 1rem 0; min-width: 22rem',
	cell: 'padding: 0.4rem 1rem 0.4rem 0; border-bottom: 1px solid #dfe5e1',
	number: 'padding: 0.4rem 0 0.4rem 1rem; border-bottom: 1px solid #dfe5e1; text-align: right',
	total: 'padding: 0.6rem 0 0; font-weight: 600'
};

function escape(value: string) {
	return value
		.replaceAll('&', '&amp;')
		.replaceAll('<', '&lt;')
		.replaceAll('>', '&gt;')
		.replaceAll('"', '&quot;');
}
