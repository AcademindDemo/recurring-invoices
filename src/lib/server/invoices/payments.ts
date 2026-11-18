import { and, eq, sum } from 'drizzle-orm';
import { z } from 'zod';
import { paymentMethods } from '../../invoices/payments.ts';
import { formatMoney, parseMoney } from '../../money.ts';
import type { Db } from '../db/client.ts';
import { invoice, payment } from '../db/schema.ts';

export const paymentInput = z.object({
	amount: z.string().transform((value, ctx) => {
		const cents = parseMoney(value);
		if (!cents) {
			ctx.addIssue({ code: 'custom', message: 'Enter the amount received, like 120 or 120.50.' });
			return z.NEVER;
		}
		return cents;
	}),
	paidOn: z.iso.date({ error: 'Enter the date the money arrived.' }),
	method: z.enum(paymentMethods, { error: 'Choose how the client paid.' }),
	note: z.string().trim()
});

export type PaymentInput = z.infer<typeof paymentInput>;

/** What is left to pay on an invoice. */
export function balanceDue(total: number, payments: { amount: number }[]) {
	return total - payments.reduce((paid, { amount }) => paid + amount, 0);
}

/** Records a payment on a sent or overdue invoice and marks the invoice paid once it covers the balance. */
export function recordPayment(db: Db, userId: string, invoiceId: number, input: PaymentInput) {
	return db.transaction((tx) => {
		const target = tx
			.select()
			.from(invoice)
			.where(and(eq(invoice.userId, userId), eq(invoice.id, invoiceId)))
			.get();
		if (target?.status !== 'sent' && target?.status !== 'overdue') {
			return { error: 'Only sent invoices take payments.' };
		}

		const { paid } = tx
			.select({ paid: sum(payment.amount).mapWith(Number) })
			.from(payment)
			.where(eq(payment.invoiceId, invoiceId))
			.get()!;
		const balance = target.total - paid;
		if (input.amount > balance) {
			return { error: `That’s more than the ${formatMoney(balance, target.currency)} still due.` };
		}

		const recorded = tx
			.insert(payment)
			.values({ invoiceId, ...input, note: input.note || null })
			.returning()
			.get();
		if (input.amount === balance) {
			tx.update(invoice)
				.set({ status: 'paid', paidOn: input.paidOn })
				.where(eq(invoice.id, invoiceId))
				.run();
		}

		return { payment: recorded };
	});
}
