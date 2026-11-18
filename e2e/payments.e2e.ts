import { expect, test } from '@playwright/test';
import { createClient, sendInvoice, signUp } from './helpers.ts';

test.beforeEach(async ({ page }) => {
	await signUp(page);
	await createClient(page);
});

test('marks an invoice paid once payments cover it', async ({ page }) => {
	await sendInvoice(page, 'Brand workshop', '1200');

	await page.getByLabel('Amount').fill('500');
	await page.getByRole('button', { name: 'Record payment' }).click();
	await expect(page.getByRole('row', { name: /Balance due/ })).toContainText('€700.00');
	await expect(page.getByLabel('Amount')).toHaveValue('700.00');

	await page.getByRole('button', { name: 'Record payment' }).click();

	await expect(page.getByRole('row', { name: /Balance due/ })).toContainText('€0.00');
	await expect(page.getByText('Paid', { exact: true }).first()).toBeVisible();
	await expect(page.getByRole('button', { name: 'Record payment' })).toBeHidden();
});
