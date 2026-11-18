import { error, fail, redirect } from '@sveltejs/kit';
import { db } from '#lib/server/db/index.ts';
import { mailer } from '#lib/server/email/index.ts';
import { parseForm } from '#lib/server/forms.ts';
import { today } from '#lib/server/invoices/dates.ts';
import { deleteDraft, getInvoice } from '#lib/server/invoices/invoices.ts';
import { balanceDue, paymentInput, recordPayment } from '#lib/server/invoices/payments.ts';
import { sendInvoice } from '#lib/server/invoices/send.ts';
import { requireUser } from '#lib/server/session.ts';
import { getSettings } from '#lib/server/settings.ts';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = ({ params }) => {
	const user = requireUser();
	const invoice = getInvoice(db, user.id, params.id);
	if (!invoice) error(404, 'Invoice not found');
	const { paymentInstructions, timeZone } = getSettings(db, user.id);

	return {
		invoice,
		balance: balanceDue(invoice.total, invoice.payments),
		paymentInstructions,
		timeZone,
		today: today(new Date(), timeZone)
	};
};

export const actions: Actions = {
	send: async ({ params }) => {
		const user = requireUser();
		const result = await sendInvoice(db, mailer, user.id, params.id);
		if (result.error) return fail(400, { sendError: result.error });
		return { sent: true };
	},
	pay: async ({ params, request }) => {
		const user = requireUser();
		const values = Object.fromEntries(await request.formData());
		const { data, errors } = parseForm(paymentInput, values);
		if (errors) return fail(400, { paymentErrors: errors, paymentValues: values });

		const result = recordPayment(db, user.id, params.id, data);
		if (result.error)
			return fail(400, { paymentErrors: { amount: [result.error] }, paymentValues: values });
		return { paid: true };
	},
	delete: ({ params }) => {
		const user = requireUser();
		if (!deleteDraft(db, user.id, params.id)) error(404, 'Draft not found');
		redirect(303, '/invoices');
	}
};
