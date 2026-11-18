import { getDashboard } from '#lib/server/dashboard.ts';
import { db } from '#lib/server/db/index.ts';
import { requireUser } from '#lib/server/session.ts';
import { getSettings } from '#lib/server/settings.ts';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = () => {
	const user = requireUser();
	return getDashboard(db, user.id, getSettings(db, user.id).timeZone);
};
