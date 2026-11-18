import { expect, test, type Page } from '@playwright/test';
import { createClient, signUp } from './helpers.ts';

test.beforeEach(async ({ page }) => {
	await signUp(page);
	await createClient(page);
});

async function createSchedule(page: Page, firstBillingDate: string) {
	await page.goto('/schedules/new');
	await page.getByRole('combobox', { name: 'Client' }).selectOption('Kauri Studio');
	await page.getByLabel('First billing date').fill(firstBillingDate);
	await page.getByLabel('Tax rate (%)').fill('19');
	await page.getByLabel('Description').fill('Design retainer');
	await page.getByLabel('Unit price').fill('1500');
	await page.getByRole('button', { name: 'Save schedule' }).click();
	await expect(page.getByRole('heading', { name: /Recurring invoice/ })).toBeVisible();
}

test('creates a monthly schedule that bills month ends', async ({ page }) => {
	await page.goto('/schedules/new');
	await page.getByRole('combobox', { name: 'Client' }).selectOption('Kauri Studio');
	await expect(page.getByRole('combobox', { name: 'How often' }).locator('option')).toHaveText([
		'Every month',
		'Every year'
	]);
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
	await expect(page.getByText('No invoices yet. The first goes out on 31 Jan 2099.')).toBeVisible();
});

test('lists schedules and pauses, resumes and ends one', async ({ page }) => {
	await page.goto('/schedules');
	await expect(page.getByText('No schedules yet')).toBeVisible();

	await createSchedule(page, '2099-03-15');
	await createSchedule(page, '2099-01-31');
	await page.getByRole('link', { name: 'Schedules' }).click();
	const rows = page.getByRole('row');
	await expect(rows.nth(1)).toContainText('31 Jan 2099');
	await expect(rows.nth(2)).toContainText('15 Mar 2099');
	await expect(rows.nth(1)).toContainText('€1,785.00');

	await rows.nth(1).getByRole('link', { name: 'Kauri Studio' }).click();
	await page.getByRole('button', { name: 'Pause' }).click();
	await expect(page.getByText('Paused')).toBeVisible();
	await expect(page.getByText('Next billing dates')).toBeHidden();

	await page.getByRole('link', { name: 'Schedules' }).click();
	await expect(rows.nth(2)).toContainText('—');
	await expect(rows.nth(2)).toContainText('Paused');

	await rows.nth(2).getByRole('link', { name: 'Kauri Studio' }).click();
	await page.getByRole('button', { name: 'Resume' }).click();
	await expect(page.getByRole('listitem').first()).toHaveText('31 Jan 2099');

	page.once('dialog', (dialog) => dialog.accept());
	await page.getByRole('button', { name: 'End', exact: true }).click();
	await expect(page.getByText('Ended')).toBeVisible();
	await expect(page.getByRole('button', { name: 'Resume' })).toBeHidden();
});
