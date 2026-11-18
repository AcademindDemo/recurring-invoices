import { mkdir, readdir, readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import nodemailer from 'nodemailer';

export type Mail = {
	to: string;
	/** Where replies go when they shouldn't go to MAIL_FROM. */
	replyTo?: string;
	subject: string;
	text: string;
	html: string;
};

export type Mailer = { send(mail: Mail): Promise<void> };

export type PreviewMail = Mail & { from: string; sentAt: string };

/** Writes every mail as a JSON file into `dir` instead of sending it. */
export function createPreviewMailer({ dir, from }: { dir: string; from: string }): Mailer {
	return {
		async send(mail) {
			const sentAt = new Date().toISOString();
			const preview: PreviewMail = { from, sentAt, ...mail };
			await mkdir(dir, { recursive: true });
			await writeFile(
				join(dir, `${sentAt.replace(/[:.]/g, '-')}-${crypto.randomUUID().slice(0, 8)}.json`),
				JSON.stringify(preview, null, '\t')
			);
		}
	};
}

export type SmtpOptions = {
	from: string;
	host: string;
	port: number;
	user?: string;
	password?: string;
};

export function createSmtpMailer({ from, host, port, user, password }: SmtpOptions): Mailer {
	const transport = nodemailer.createTransport({
		host,
		port,
		secure: port === 465,
		auth: user ? { user, pass: password } : undefined
	});
	return {
		async send(mail) {
			await transport.sendMail({ from, ...mail });
		}
	};
}

/** The mails a preview mailer wrote, newest first. */
export async function readPreviews(dir: string): Promise<PreviewMail[]> {
	const files = await readdir(dir).catch(() => []);
	const previews = await Promise.all(
		files
			.filter((file) => file.endsWith('.json'))
			.map(async (file) => JSON.parse(await readFile(join(dir, file), 'utf8')) as PreviewMail)
	);
	return previews.sort((a, b) => b.sentAt.localeCompare(a.sentAt));
}
