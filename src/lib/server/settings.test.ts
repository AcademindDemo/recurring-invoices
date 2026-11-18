import { beforeEach, describe, expect, it } from 'vitest';
import type { Db } from './db/client.ts';
import { createTestDb, createTestUser } from './db/testing.ts';
import { createDefaultSettings, getSettings, settingsInput, updateSettings } from './settings.ts';

const form = {
	businessName: 'Okafor Design',
	address: '12 Harbour Street\nBristol',
	email: '',
	currency: 'GBP',
	defaultTaxRate: '20',
	paymentTermsDays: '30',
	invoicePrefix: 'OD',
	paymentInstructions: 'Sort code 00-00-00',
	timeZone: 'Europe/London'
};

describe('settings', () => {
	let db: Db;
	let userId: string;

	beforeEach(() => {
		db = createTestDb();
		userId = createTestUser(db).id;
		createDefaultSettings(db, userId, 'Ana Silva');
	});

	it('starts with defaults named after the user', () => {
		expect(getSettings(db, userId)).toMatchObject({
			businessName: 'Ana Silva',
			currency: 'EUR',
			defaultTaxRate: 0,
			paymentTermsDays: 14,
			invoicePrefix: 'INV',
			timeZone: 'UTC'
		});
	});

	it('saves the parsed form', () => {
		updateSettings(db, userId, settingsInput.parse(form));

		expect(getSettings(db, userId)).toMatchObject({
			businessName: 'Okafor Design',
			email: null,
			currency: 'GBP',
			defaultTaxRate: 2000,
			paymentTermsDays: 30,
			invoicePrefix: 'OD',
			timeZone: 'Europe/London'
		});
	});

	it('rejects prefixes that would make odd invoice numbers', () => {
		for (const invoicePrefix of ['', 'fb', '2026', 'FERNBILL1', 'F-B']) {
			expect(settingsInput.safeParse({ ...form, invoicePrefix }).success).toBe(false);
		}
	});

	it('accepts UTC and IANA time zones only', () => {
		for (const timeZone of ['UTC', 'Pacific/Auckland']) {
			expect(settingsInput.safeParse({ ...form, timeZone }).success).toBe(true);
		}
		for (const timeZone of ['', 'CET+1', 'Auckland']) {
			expect(settingsInput.safeParse({ ...form, timeZone }).success).toBe(false);
		}
	});
});
