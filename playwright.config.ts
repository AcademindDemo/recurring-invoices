import { defineConfig } from '@playwright/test';

const port = 4173;

export default defineConfig({
	testDir: 'e2e',
	testMatch: '**/*.e2e.ts',
	workers: 4,
	use: { baseURL: `http://localhost:${port}` },
	webServer: {
		// A fresh database for every run
		command: 'rm -f e2e.db* && pnpm db:migrate && pnpm build && pnpm preview',
		port,
		env: {
			DATABASE_URL: 'e2e.db',
			ORIGIN: `http://localhost:${port}`,
			BETTER_AUTH_SECRET: 'e2e-secret-not-for-production-00000000',
			MAIL_TRANSPORT: 'preview',
			MAIL_PREVIEW_DIR: 'test-results/mail'
		}
	}
});
