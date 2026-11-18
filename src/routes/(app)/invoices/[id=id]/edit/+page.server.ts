import { error, fail, redirect } from '@sveltejs/kit';
import { listClients } from '#lib/server/clients.ts';
import { db } from '#lib/server/db/index.ts';
import { parseForm } from '#lib/server/forms.ts';
import {
	getInvoice,
	invoiceFormValues,
	invoiceInput,
	toInvoiceFormValues,
	updateDraft
} from '#lib/server/invoices/invoices.ts';
import { requireUser } from '#lib/server/session.ts';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = ({ params }) => {
	const user = requireUser();
	const invoice = getInvoice(db, user.id, params.id);
	if (!invoice) error(404, 'Invoice not found');
	if (invoice.status !== 'draft') redirect(303, `/invoices/${invoice.id}`);

	return {
		invoice,
		clients: listClients(db, user.id),
		values: toInvoiceFormValues(invoice)
	};
};

export const actions: Actions = {
	default: async ({ params, request }) => {
		const user = requireUser();
		const values = invoiceFormValues(await request.formData());
		const { data, errors } = parseForm(invoiceInput, values);
		if (errors) return fail(400, { errors, values });

		if (!updateDraft(db, user.id, params.id, data)) error(404, 'Draft not found');
		redirect(303, `/invoices/${params.id}`);
	}
};
