import { execFileSync } from 'node:child_process';
import { expect, type Page } from '@playwright/test';
import { serverEnv } from './server.ts';

/** Signs up a new user with a unique email and lands on the dashboard. */
export async function signUp(page: Page, name = 'Ana Silva') {
	const email = `${crypto.randomUUID()}@example.com`;
	await page.goto('/signup');
	await page.getByLabel('Your name').fill(name);
	await page.getByLabel('Email').fill(email);
	await page.getByLabel('Password').fill('correct horse battery');
	await page.getByRole('button', { name: 'Create account' }).click();
	await expect(page.getByRole('heading', { name: `Welcome back, ${name}` })).toBeVisible();
	return { email, password: 'correct horse battery' };
}

export async function createClient(page: Page, name = 'Kauri Studio') {
	await page.goto('/clients/new');
	await page.getByLabel('Name').fill(name);
	await page.getByLabel('Email').fill('accounts@kauri.example');
	await page.getByRole('button', { name: 'Save client' }).click();
	await expect(page.getByRole('heading', { name })).toBeVisible();
}

/** Creates a one-line invoice for Kauri Studio and sends it. */
export async function sendInvoice(page: Page, description: string, unitPrice: string) {
	await page.goto('/invoices/new');
	await page.getByRole('combobox', { name: 'Client' }).selectOption('Kauri Studio');
	await page.getByLabel('Description').fill(description);
	await page.getByLabel('Unit price').fill(unitPrice);
	await page.getByRole('button', { name: 'Save draft' }).click();
	await page.getByRole('button', { name: 'Send to client' }).click();
	await expect(page.getByText('to accounts@kauri.example')).toBeVisible();
}

/** Runs the jobs that are due against the e2e database, like the scheduler does every few minutes. */
export function runJobs() {
	execFileSync('pnpm', ['jobs:run'], { env: { ...process.env, ...serverEnv } });
}
