export const port = 4173;

/** The e2e server's environment, also used by scripts that a test runs against its database. */
export const serverEnv = {
	DATABASE_URL: 'e2e.db',
	ORIGIN: `http://localhost:${port}`,
	BETTER_AUTH_SECRET: 'e2e-secret-not-for-production-00000000',
	MAIL_TRANSPORT: 'preview',
	MAIL_PREVIEW_DIR: 'test-results/mail'
};
