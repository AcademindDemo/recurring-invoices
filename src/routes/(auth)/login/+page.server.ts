import { fail, redirect } from '@sveltejs/kit';
import { APIError } from 'better-auth/api';
import { auth } from '#lib/server/auth.ts';
import type { Actions } from './$types';

export const actions: Actions = {
	default: async ({ request }) => {
		const data = await request.formData();
		const email = String(data.get('email') ?? '');
		const password = String(data.get('password') ?? '');

		try {
			await auth.api.signInEmail({ body: { email, password } });
		} catch (error) {
			if (error instanceof APIError) {
				return fail(400, { email, message: 'Wrong email or password.' });
			}
			throw error;
		}

		redirect(303, '/');
	}
};
