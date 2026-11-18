import { fail, redirect } from '@sveltejs/kit';
import { clientInput, createClient } from '#lib/server/clients.ts';
import { db } from '#lib/server/db/index.ts';
import { parseForm } from '#lib/server/forms.ts';
import { requireUser } from '#lib/server/session.ts';
import type { Actions } from './$types';

export const actions: Actions = {
	default: async ({ request }) => {
		const user = requireUser();
		const values = Object.fromEntries(await request.formData());
		const { data, errors } = parseForm(clientInput, values);
		if (errors) return fail(400, { errors, values });

		const client = createClient(db, user.id, data);
		redirect(303, `/clients/${client.id}`);
	}
};
