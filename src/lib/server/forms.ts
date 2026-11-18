import { z } from 'zod';
import { parseTaxRate } from '../invoices/totals.ts';
import { parseMoney } from '../money.ts';

/** Parses submitted form values with a schema. Returns either the parsed data or the errors per field. */
export function parseForm<T extends z.ZodType>(schema: T, values: Record<string, unknown>) {
	const result = schema.safeParse(values);
	if (result.success) return { data: result.data, errors: undefined };
	return { data: undefined, errors: z.flattenError(result.error).fieldErrors };
}

/** A tax rate typed as a percentage, parsed to basis points. */
export const taxRateField = z.string().transform((value, ctx) => {
	const basisPoints = parseTaxRate(value);
	if (basisPoints === undefined) {
		ctx.addIssue({ code: 'custom', message: 'Enter a tax rate between 0 and 100.' });
		return z.NEVER;
	}
	return basisPoints;
});

export const isoDateField = z.iso.date({ error: 'Enter a date.' });

const lineInput = z.object({
	description: z.string().trim().min(1, 'Describe each line.'),
	quantity: z.coerce.number<string>().positive('Quantities must be above zero.'),
	unitPrice: z.string().transform((value, ctx) => {
		const cents = parseMoney(value);
		if (cents === undefined) {
			ctx.addIssue({ code: 'custom', message: 'Enter prices like 120 or 120.50.' });
			return z.NEVER;
		}
		return cents;
	})
});

/** Invoice and schedule lines, at least one. */
export const linesField = z.array(lineInput).min(1, 'Add at least one line.');

export type LineFormValues = { description: string; quantity: string; unitPrice: string };

/** A submitted form value as text, empty when missing. */
export function formText(value: FormDataEntryValue | null | undefined): string {
	return typeof value === 'string' ? value : '';
}

/** Line editors post one description, quantity and unit price per line. */
export function lineFormValues(form: FormData): LineFormValues[] {
	const quantities = form.getAll('quantity');
	const unitPrices = form.getAll('unitPrice');
	return form.getAll('description').map((description, i) => ({
		description: formText(description),
		quantity: formText(quantities[i]),
		unitPrice: formText(unitPrices[i])
	}));
}
