import { dev } from '$app/env';
import {
	MAIL_FROM,
	MAIL_PREVIEW_DIR,
	MAIL_TRANSPORT,
	SMTP_HOST,
	SMTP_PASSWORD,
	SMTP_PORT,
	SMTP_USER
} from '$app/env/private';
import { createMailer } from './mailer.ts';

// Development never sends real mail, whatever MAIL_TRANSPORT says
export const mailer = createMailer({
	MAIL_TRANSPORT: dev ? 'preview' : MAIL_TRANSPORT,
	MAIL_FROM,
	MAIL_PREVIEW_DIR,
	SMTP_HOST,
	SMTP_PORT,
	SMTP_USER,
	SMTP_PASSWORD
});
