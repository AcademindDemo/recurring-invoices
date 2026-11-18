import { expect, test } from '@playwright/test';
import { createClient, signUp } from './helpers.ts';

test.beforeEach(async ({ page }) => {
	await signUp(page);
	await createClient(page);
});

test('creates a monthly schedule that bills month ends', async ({ page }) => {
	await page.goto('/schedules/new');
	await page.getByRole('combobox', { name: 'Client' }).selectOption('Kauri Studio');
	await page.getByLabel('First billing date').fill('2099-01-31');
	await page.getByLabel('Tax rate (%)').fill('19');
	await page.getByLabel('Description').fill('Design retainer');
	await page.getByLabel('Unit price').fill('1500');

	await page.getByRole('button', { name: 'Save schedule' }).click();

	await expect(
		page.getByRole('heading', { name: 'Recurring invoice for Kauri Studio' })
	).toBeVisible();
	await expect(page.getByRole('listitem')).toHaveText([
		'31 Jan 2099',
		'28 Feb 2099',
		'31 Mar 2099'
	]);
	await expect(page.getByRole('row', { name: /Total per invoice/ })).toContainText('€1,785.00');
});
