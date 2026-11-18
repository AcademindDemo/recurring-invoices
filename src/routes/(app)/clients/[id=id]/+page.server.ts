import { error, fail } from '@sveltejs/kit';
import { clientInput, getClient, updateClient } from '#lib/server/clients.ts';
import { db } from '#lib/server/db/index.ts';
import { parseForm } from '#lib/server/forms.ts';
import { listInvoices } from '#lib/server/invoices/invoices.ts';
import { requireUser } from '#lib/server/session.ts';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = ({ params }) => {
	const user = requireUser();
	const client = getClient(db, user.id, params.id);
	if (!client) error(404, 'Client not found');

	return { client, invoices: listInvoices(db, user.id, { clientId: client.id }) };
};

export const actions: Actions = {
	update: async ({ params, request }) => {
		const user = requireUser();
		const values = Object.fromEntries(await request.formData());
		const { data, errors } = parseForm(clientInput, values);
		if (errors) return fail(400, { errors, values });

		const client = updateClient(db, user.id, params.id, data);
		if (!client) error(404, 'Client not found');

		return { saved: true };
	}
};
