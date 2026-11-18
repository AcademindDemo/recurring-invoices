import { and, eq } from 'drizzle-orm';
import type { Db } from '../db/client.ts';
import { invoice } from '../db/schema.ts';
import type { Mailer } from '../email/mailer.ts';
import { invoiceEmail } from '../email/templates.ts';
import { getSettings } from '../settings.ts';
import { getInvoice } from './invoices.ts';

/** Emails a draft to its client and marks it sent. */
export async function sendInvoice(db: Db, mailer: Mailer, userId: string, id: number) {
	const draft = getInvoice(db, userId, id);
	if (draft?.status !== 'draft') return { error: 'Only drafts can be sent.' };
	if (!draft.client.email) return { error: `Add an email address for ${draft.client.name} first.` };

	const settings = getSettings(db, userId);
	await mailer.send({
		to: draft.client.email,
		replyTo: settings.email ?? undefined,
		...invoiceEmail({ invoice: draft, client: draft.client, settings })
	});

	const sent = db
		.update(invoice)
		.set({ status: 'sent', sentAt: new Date() })
		.where(and(eq(invoice.userId, userId), eq(invoice.id, id)))
		.returning()
		.get();
	return { invoice: sent };
}
