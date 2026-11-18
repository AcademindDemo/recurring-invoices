import { fail } from '@sveltejs/kit';
import { db } from '#lib/server/db/index.ts';
import { parseForm } from '#lib/server/forms.ts';
import { requireUser } from '#lib/server/session.ts';
import { getSettings, settingsInput, updateSettings } from '#lib/server/settings.ts';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = () => {
	const user = requireUser();
	return { settings: getSettings(db, user.id) };
};

export const actions: Actions = {
	default: async ({ request }) => {
		const user = requireUser();
		const values = Object.fromEntries(await request.formData());
		const { data, errors } = parseForm(settingsInput, values);
		if (errors) return fail(400, { errors, values });

		updateSettings(db, user.id, data);
		return { saved: true };
	}
};
