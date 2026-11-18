import { error } from '@sveltejs/kit';
import { dev } from '$app/env';
import { MAIL_PREVIEW_DIR } from '$app/env/private';
import { readPreviews } from '#lib/server/email/mailer.ts';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async () => {
	if (!dev) error(404, 'Not found');
	return { mails: await readPreviews(MAIL_PREVIEW_DIR) };
};
