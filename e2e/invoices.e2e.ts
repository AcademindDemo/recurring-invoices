import { expect, test } from '@playwright/test';
import { createClient, signUp } from './helpers.ts';

test.beforeEach(async ({ page }) => {
	await signUp(page);
	await createClient(page);
});

test('creates a draft invoice with live totals', async ({ page }) => {
	await page.goto('/invoices/new');
	await page.getByRole('combobox', { name: 'Client' }).selectOption('Kauri Studio');
	await page.getByLabel('Tax rate (%)').fill('19');

	await page.getByLabel('Description').fill('Design workshop');
	await page.getByLabel('Unit price').fill('800');
	await page.getByRole('button', { name: 'Add line' }).click();
	await page.getByLabel('Description').nth(1).fill('Logo concepts');
	await page.getByLabel('Quantity').nth(1).fill('3');
	await page.getByLabel('Unit price').nth(1).fill('250');
	await expect(page.getByText('€1,844.50')).toBeVisible();

	await page.getByRole('button', { name: 'Save draft' }).click();

	await expect(page.getByRole('heading', { name: /^INV-\d{4}-0001$/ })).toBeVisible();
	await expect(page.getByText('Draft')).toBeVisible();
	await expect(page.getByRole('row', { name: /Logo concepts/ })).toContainText('€750.00');
	await expect(page.getByRole('row', { name: /Total/ })).toContainText('€1,844.50');
});

test('edits and deletes a draft', async ({ page }) => {
	await page.goto('/invoices/new');
	await page.getByRole('combobox', { name: 'Client' }).selectOption('Kauri Studio');
	await page.getByLabel('Description').fill('Hosting');
	await page.getByLabel('Unit price').fill('50');
	await page.getByRole('button', { name: 'Save draft' }).click();

	await page.getByRole('link', { name: 'Edit' }).click();
	await page.getByLabel('Quantity').fill('12');
	await page.getByRole('button', { name: 'Save changes' }).click();
	await expect(page.getByRole('row', { name: /Total/ })).toContainText('€600.00');

	page.once('dialog', (dialog) => dialog.accept());
	await page.getByRole('button', { name: 'Delete' }).click();
	await expect(page.getByRole('heading', { name: 'No invoices yet' })).toBeVisible();
});

test('sends a draft to the client', async ({ page }) => {
	await page.goto('/invoices/new');
	await page.getByRole('combobox', { name: 'Client' }).selectOption('Kauri Studio');
	await page.getByLabel('Description').fill('Strategy session');
	await page.getByLabel('Unit price').fill('400');
	await page.getByRole('button', { name: 'Save draft' }).click();

	await page.getByRole('button', { name: 'Send to client' }).click();

	await expect(page.getByText('Sent', { exact: true }).first()).toBeVisible();
	await expect(page.getByText('to accounts@kauri.example')).toBeVisible();
	await expect(page.getByRole('button', { name: 'Send to client' })).toBeHidden();
});
