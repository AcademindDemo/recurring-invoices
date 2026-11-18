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
import { createPreviewMailer, createSmtpMailer } from './mailer.ts';

// Development never sends real mail, whatever MAIL_TRANSPORT says
export const mailer =
	MAIL_TRANSPORT === 'smtp' && !dev
		? createSmtpMailer({
				from: MAIL_FROM,
				host: SMTP_HOST,
				port: SMTP_PORT,
				user: SMTP_USER,
				password: SMTP_PASSWORD
			})
		: createPreviewMailer({ dir: MAIL_PREVIEW_DIR, from: MAIL_FROM });
