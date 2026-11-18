import { expect, test } from '@playwright/test';
import { formatDate } from '../src/lib/format.ts';
import { addMonths } from '../src/lib/server/invoices/dates.ts';
import { createClient, runJobs, signUp } from './helpers.ts';

test('bills a schedule on its first date and keeps its invoices after it ends', async ({
	page
}) => {
	await signUp(page);
	await createClient(page);

	await page.goto('/schedules/new');
	await page.getByRole('combobox', { name: 'Client' }).selectOption('Kauri Studio');
	await page.getByLabel('Description').fill('Design retainer');
	await page.getByLabel('Unit price').fill('1500');
	const firstBillingDate = await page.getByLabel('First billing date').inputValue();
	await page.getByRole('button', { name: 'Save schedule' }).click();
	await expect(page.getByText(/No invoices yet\. The first goes out on/)).toBeVisible();
	const scheduleUrl = page.url();

	runJobs();

	await page.goto('/invoices');
	await page
		.getByRole('row', { name: /Kauri Studio/ })
		.getByRole('link')
		.click();
	await expect(page.getByRole('heading', { name: /INV-/ })).toBeVisible();
	await expect(page.getByText('Sent', { exact: true }).first()).toBeVisible();
	const invoiceNumber = await page.getByRole('heading', { name: /INV-/ }).innerText();

	await page.getByRole('link', { name: 'View the schedule' }).click();
	await expect(page).toHaveURL(scheduleUrl);
	await expect(page.getByRole('listitem').first()).toHaveText(
		formatDate(addMonths(firstBillingDate, 1))
	);
	await expect(page.getByRole('link', { name: invoiceNumber })).toBeVisible();

	page.once('dialog', (dialog) => dialog.accept());
	await page.getByRole('button', { name: 'End', exact: true }).click();
	await expect(page.getByText('Ended')).toBeVisible();
	await page.getByRole('link', { name: invoiceNumber }).click();
	await expect(page.getByRole('heading', { name: invoiceNumber })).toBeVisible();
	await expect(page.getByRole('link', { name: 'View the schedule' })).toBeVisible();
});
