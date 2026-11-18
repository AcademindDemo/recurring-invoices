import type { Mail, Mailer } from './mailer.ts';

/** A mailer that keeps what it sends in `sent`. */
export function createTestMailer(): Mailer & { sent: Mail[] } {
	const sent: Mail[] = [];
	return {
		sent,
		async send(mail) {
			sent.push(mail);
		}
	};
}
