import { error } from '@sveltejs/kit';
import { db } from '#lib/server/db/index.ts';
import { today } from '#lib/server/invoices/dates.ts';
import { getSchedule, upcomingBillingDates } from '#lib/server/schedules/schedules.ts';
import { requireUser } from '#lib/server/session.ts';
import { getSettings } from '#lib/server/settings.ts';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = ({ params }) => {
	const user = requireUser();
	const schedule = getSchedule(db, user.id, params.id);
	if (!schedule) error(404, 'Schedule not found');

	return {
		schedule,
		currency: getSettings(db, user.id).currency,
		upcoming: upcomingBillingDates(schedule, today(), 3)
	};
};
