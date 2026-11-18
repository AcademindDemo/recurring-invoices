import { fail, redirect } from '@sveltejs/kit';
import { listClients } from '#lib/server/clients.ts';
import { db } from '#lib/server/db/index.ts';
import { parseForm } from '#lib/server/forms.ts';
import { addDays, today } from '#lib/server/invoices/dates.ts';
import {
	createInvoice,
	invoiceFormValues,
	invoiceInput,
	type InvoiceFormValues
} from '#lib/server/invoices/invoices.ts';
import { requireUser } from '#lib/server/session.ts';
import { getSettings } from '#lib/server/settings.ts';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = ({ url }) => {
	const user = requireUser();
	const settings = getSettings(db, user.id);
	const issueDate = today();
	const values: InvoiceFormValues = {
		clientId: url.searchParams.get('client') ?? '',
		issueDate,
		dueDate: addDays(issueDate, settings.paymentTermsDays),
		taxRate: String(settings.defaultTaxRate / 100),
		notes: '',
		lines: [{ description: '', quantity: '1', unitPrice: '' }]
	};
	return { clients: listClients(db, user.id), currency: settings.currency, values };
};

export const actions: Actions = {
	default: async ({ request }) => {
		const user = requireUser();
		const values = invoiceFormValues(await request.formData());
		const { data, errors } = parseForm(invoiceInput, values);
		if (errors) return fail(400, { errors, values });

		const settings = getSettings(db, user.id);
		const invoice = createInvoice(db, user.id, data, {
			prefix: settings.invoicePrefix,
			currency: settings.currency
		});
		redirect(303, `/invoices/${invoice.id}`);
	}
};
