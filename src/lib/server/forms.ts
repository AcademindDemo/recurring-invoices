import { z } from 'zod';
import { parseTaxRate } from '../invoices/totals.ts';

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
