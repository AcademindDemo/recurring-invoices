import { describe, expect, it } from 'vitest';
import { clientInput, createClient, listClients } from './clients.ts';
import { createTestClient, createTestDb, createTestUser } from './db/testing.ts';
import { parseForm } from './forms.ts';
import { createInvoice } from './invoices/invoices.ts';

describe('clientInput', () => {
	it('accepts a client without an email address', () => {
		const { data } = parseForm(clientInput, { name: 'Kauri Studio', email: '  ', address: '' });

		expect(data?.email).toBe('');
	});

	it('rejects an email address mail could never reach', () => {
		const { errors } = parseForm(clientInput, {
			name: 'Kauri Studio',
			email: 'accounts@kauri',
			address: ''
		});

		expect(errors?.email).toEqual([
			'Enter an email address like name@example.com, or leave it empty.'
		]);
	});
});

describe('listClients', () => {
	it('finds clients by part of their name or email', () => {
		const db = createTestDb();
		const userId = createTestUser(db).id;
		createClient(db, userId, {
			name: 'Kauri Studio',
			email: 'accounts@kauri.example',
			address: ''
		});
		createClient(db, userId, {
			name: 'Harbour Books',
			email: 'hello@harbour.example',
			address: ''
		});

		expect(listClients(db, userId, 'kauri').map((c) => c.name)).toEqual(['Kauri Studio']);
		expect(listClients(db, userId, 'harbour.example').map((c) => c.name)).toEqual([
			'Harbour Books'
		]);
		expect(listClients(db, userId, '  ')).toHaveLength(2);
	});

	it('counts each client’s invoices', () => {
		const db = createTestDb();
		const userId = createTestUser(db).id;
		const kauri = createTestClient(db, userId, 'Kauri Studio');
		createTestClient(db, userId, 'Harbour Books');
		const input = {
			clientId: kauri.id,
			issueDate: '2026-09-01',
			dueDate: '2026-09-15',
			taxRate: 0,
			notes: '',
			lines: [{ description: 'Retainer', quantity: 1, unitPrice: 100000 }]
		};
		createInvoice(db, userId, input, { prefix: 'INV', currency: 'EUR' });
		createInvoice(db, userId, input, { prefix: 'INV', currency: 'EUR' });

		expect(listClients(db, userId).map((c) => [c.name, c.invoiceCount])).toEqual([
			['Harbour Books', 0],
			['Kauri Studio', 2]
		]);
	});
});
