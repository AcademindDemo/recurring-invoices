import { redirect } from '@sveltejs/kit';
import { getRequestEvent } from '$app/server';

/** The signed-in user, or a redirect to the login page. Use it in every load and action that needs one. */
export function requireUser() {
	const { locals } = getRequestEvent();
	if (!locals.user) redirect(303, '/login');
	return locals.user;
}
