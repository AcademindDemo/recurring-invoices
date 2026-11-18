import { defineEnvVars } from '@sveltejs/kit/env';
import { z } from 'zod';

export const variables = defineEnvVars({
	DATABASE_URL: { description: 'Path to the SQLite database file, e.g. `local.db`.' },
	ORIGIN: { description: 'The public URL of the app, e.g. `http://localhost:5173`.' },
	BETTER_AUTH_SECRET: {
		description: 'Secret Better Auth signs sessions with. At least 32 random characters.'
	},
	MAIL_TRANSPORT: {
		description:
			'`preview` writes mail to MAIL_PREVIEW_DIR, `smtp` sends it. Development always previews.',
		schema: z.enum(['preview', 'smtp']).default('preview')
	},
	MAIL_FROM: {
		description: 'Sender of all mail, e.g. `Fernbill <invoices@example.com>`.',
		schema: z.string().default('Fernbill <invoices@fernbill.local>')
	},
	MAIL_PREVIEW_DIR: {
		description: 'Folder the preview mailer writes mails to.',
		schema: z.string().default('.mail-preview')
	},
	SMTP_HOST: { schema: z.string().default('') },
	SMTP_PORT: { schema: z.coerce.number<string>().int().default(587) },
	SMTP_USER: { schema: z.string().optional() },
	SMTP_PASSWORD: { schema: z.string().optional() }
});
