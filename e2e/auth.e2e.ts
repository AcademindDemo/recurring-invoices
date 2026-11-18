import { expect, test } from '@playwright/test';
import { signUp } from './helpers.ts';

test('signs up, logs out and logs back in', async ({ page }) => {
	const { email, password } = await signUp(page);

	await page.getByRole('button', { name: 'Log out' }).click();
	await expect(page.getByRole('heading', { name: 'Log in' })).toBeVisible();

	await page.getByLabel('Email').fill(email);
	await page.getByLabel('Password').fill(password);
	await page.getByRole('button', { name: 'Log in' }).click();
	await expect(page.getByRole('heading', { name: 'Welcome back, Ana Silva' })).toBeVisible();
});

test('sends signed-out visitors to the login page', async ({ page }) => {
	await page.goto('/invoices');
	await expect(page).toHaveURL('/login');
});
