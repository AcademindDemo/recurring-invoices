import { defineConfig } from '@playwright/test';
import { port, serverEnv } from './e2e/server.ts';

export default defineConfig({
	testDir: 'e2e',
	testMatch: '**/*.e2e.ts',
	workers: 4,
	use: { baseURL: `http://localhost:${port}` },
	webServer: {
		// A fresh database for every run
		command: 'rm -f e2e.db* && pnpm db:migrate && pnpm build && pnpm preview',
		port,
		env: serverEnv
	}
});
