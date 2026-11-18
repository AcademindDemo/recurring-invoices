import { eq } from 'drizzle-orm';
import { z } from 'zod';
import { currencies } from '../money.ts';
import { timeZones } from '../time-zones.ts';
import type { Db } from './db/client.ts';
import { settings } from './db/schema.ts';
import { taxRateField } from './forms.ts';

export const settingsInput = z.object({
	businessName: z.string().trim().min(1, 'Enter your business name.'),
	address: z.string().trim(),
	email: z.string().trim(),
	currency: z.enum(currencies, { error: 'Choose a currency.' }),
	defaultTaxRate: taxRateField,
	paymentTermsDays: z.coerce
		.number<string>()
		.int('Enter whole days.')
		.min(0, 'Enter whole days.')
		.max(365, 'Use at most 365 days.'),
	invoicePrefix: z
		.string()
		.trim()
		.regex(
			/^[A-Z][A-Z0-9]{0,7}$/,
			'Use up to 8 capital letters or digits, starting with a letter.'
		),
	paymentInstructions: z.string().trim(),
	timeZone: z.string().refine((zone) => timeZones.includes(zone), 'Choose a time zone.')
});

export type SettingsInput = z.infer<typeof settingsInput>;

/** Every user gets settings when they sign up, named after them until they change it. */
export function createDefaultSettings(db: Db, userId: string, businessName: string) {
	db.insert(settings).values({ userId, businessName }).run();
}

export function getSettings(db: Db, userId: string) {
	const row = db.select().from(settings).where(eq(settings.userId, userId)).get();
	if (!row) throw new Error(`No settings for user ${userId}`);
	return row;
}

export function updateSettings(db: Db, userId: string, input: SettingsInput) {
	return db
		.update(settings)
		.set({
			...input,
			address: input.address || null,
			email: input.email || null,
			paymentInstructions: input.paymentInstructions || null
		})
		.where(eq(settings.userId, userId))
		.returning()
		.get();
}
