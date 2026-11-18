import { db } from '#lib/server/db/index.ts';
import { listSchedules } from '#lib/server/schedules/schedules.ts';
import { requireUser } from '#lib/server/session.ts';
import { getSettings } from '#lib/server/settings.ts';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = () => {
	const user = requireUser();
	return {
		schedules: listSchedules(db, user.id),
		currency: getSettings(db, user.id).currency
	};
};
