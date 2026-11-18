import { fail, redirect } from '@sveltejs/kit';
import { getClient, listClients } from '#lib/server/clients.ts';
import { db } from '#lib/server/db/index.ts';
import { parseForm } from '#lib/server/forms.ts';
import { today } from '#lib/server/invoices/dates.ts';
import {
	createSchedule,
	scheduleFormValues,
	scheduleInput,
	type ScheduleFormValues
} from '#lib/server/schedules/schedules.ts';
import { requireUser } from '#lib/server/session.ts';
import { getSettings } from '#lib/server/settings.ts';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = ({ url }) => {
	const user = requireUser();
	const settings = getSettings(db, user.id);
	const values: ScheduleFormValues = {
		clientId: url.searchParams.get('client') ?? '',
		intervalMonths: '1',
		firstBillingDate: today(new Date(), settings.timeZone),
		taxRate: String(settings.defaultTaxRate / 100),
		notes: '',
		lines: [{ description: '', quantity: '1', unitPrice: '' }]
	};
	return { clients: listClients(db, user.id), currency: settings.currency, values };
};

export const actions: Actions = {
	default: async ({ request }) => {
		const user = requireUser();
		const values = scheduleFormValues(await request.formData());
		const { data, errors } = parseForm(scheduleInput, values);
		if (errors) return fail(400, { errors, values });

		const client = getClient(db, user.id, data.clientId);
		if (!client?.email) {
			const clientId = [`Add an email address for ${client?.name ?? 'this client'} first.`];
			return fail(400, { errors: { clientId }, values });
		}

		const schedule = createSchedule(db, user.id, data);
		redirect(303, `/schedules/${schedule.id}`);
	}
};
