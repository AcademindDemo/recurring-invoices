import { error, fail } from '@sveltejs/kit';
import { db } from '#lib/server/db/index.ts';
import { today } from '#lib/server/invoices/dates.ts';
import { listInvoices } from '#lib/server/invoices/invoices.ts';
import {
	endSchedule,
	getSchedule,
	pauseSchedule,
	resumeSchedule,
	upcomingBillingDates
} from '#lib/server/schedules/schedules.ts';
import { requireUser } from '#lib/server/session.ts';
import { getSettings } from '#lib/server/settings.ts';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = ({ params }) => {
	const user = requireUser();
	const schedule = getSchedule(db, user.id, params.id);
	if (!schedule) error(404, 'Schedule not found');

	return {
		schedule,
		currency: getSettings(db, user.id).currency,
		upcoming: schedule.nextBillingOn
			? upcomingBillingDates(schedule, schedule.nextBillingOn, 3)
			: [],
		invoices: listInvoices(db, user.id, { scheduleId: schedule.id })
	};
};

export const actions: Actions = {
	pause: ({ params }) => {
		const user = requireUser();
		if (!pauseSchedule(db, user.id, params.id))
			return fail(409, { statusError: 'Only an active schedule can be paused.' });
	},
	resume: ({ params }) => {
		const user = requireUser();
		const { timeZone } = getSettings(db, user.id);
		if (!resumeSchedule(db, user.id, params.id, today(new Date(), timeZone)))
			return fail(409, { statusError: 'Only a paused schedule can be resumed.' });
	},
	end: ({ params }) => {
		const user = requireUser();
		if (!endSchedule(db, user.id, params.id))
			return fail(409, { statusError: 'This schedule has already ended.' });
	}
};
