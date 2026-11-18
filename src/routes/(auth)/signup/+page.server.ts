import { fail, redirect } from '@sveltejs/kit';
import { APIError } from 'better-auth/api';
import { auth } from '#lib/server/auth.ts';
import type { Actions } from './$types';

export const actions: Actions = {
	default: async ({ request }) => {
		const data = await request.formData();
		const name = String(data.get('name') ?? '').trim();
		const email = String(data.get('email') ?? '').trim();
		const password = String(data.get('password') ?? '');

		if (password.length < 8) {
			return fail(400, { name, email, message: 'Use at least 8 characters for your password.' });
		}

		try {
			await auth.api.signUpEmail({ body: { name, email, password } });
		} catch (error) {
			if (error instanceof APIError) {
				return fail(400, { name, email, message: error.message });
			}
			throw error;
		}

		redirect(303, '/');
	}
};
