import { beforeEach, describe, expect, it } from 'vitest';
import type { Db } from '../db/client.ts';
import { invoice } from '../db/schema.ts';
import { createTestClient, createTestDb, createTestUser } from '../db/testing.ts';
import { formatInvoiceNumber, nextInvoiceSequence } from './numbering.ts';

describe('formatInvoiceNumber', () => {
	it('pads the sequence to four digits', () => {
		expect(formatInvoiceNumber('FB', 2026, 42)).toBe('FB-2026-0042');
		expect(formatInvoiceNumber('INV', 2027, 1)).toBe('INV-2027-0001');
	});

	it('keeps sequences beyond 9999', () => {
		expect(formatInvoiceNumber('FB', 2026, 12345)).toBe('FB-2026-12345');
	});
});

describe('nextInvoiceSequence', () => {
	let db: Db;
	let userId: string;
	let clientId: number;

	beforeEach(() => {
		db = createTestDb();
		userId = createTestUser(db).id;
		clientId = createTestClient(db, userId).id;
	});

	function addInvoice(owner: string, year: number, sequence: number) {
		db.insert(invoice)
			.values({
				userId: owner,
				clientId,
				number: formatInvoiceNumber('FB', year, sequence),
				numberYear: year,
				numberSequence: sequence,
				issueDate: `${year}-03-01`,
				dueDate: `${year}-03-15`,
				currency: 'EUR',
				taxRate: 0,
				subtotal: 0,
				tax: 0,
				total: 0
			})
			.run();
	}

	it('starts at 1', () => {
		expect(nextInvoiceSequence(db, userId, 2026)).toBe(1);
	});

	it('continues after the highest number of the year', () => {
		addInvoice(userId, 2026, 1);
		addInvoice(userId, 2026, 41);
		expect(nextInvoiceSequence(db, userId, 2026)).toBe(42);
	});

	it('starts again in a new year', () => {
		addInvoice(userId, 2026, 7);
		expect(nextInvoiceSequence(db, userId, 2027)).toBe(1);
	});

	it('counts each user separately', () => {
		const other = createTestUser(db, 'Ben Carter').id;
		addInvoice(other, 2026, 9);
		expect(nextInvoiceSequence(db, userId, 2026)).toBe(1);
	});
});
