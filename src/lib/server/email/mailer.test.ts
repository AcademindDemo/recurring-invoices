import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createPreviewMailer, readPreviews } from './mailer.ts';

describe('preview mailer', () => {
	let dir: string;

	beforeEach(async () => {
		dir = await mkdtemp(join(tmpdir(), 'fernbill-mail-'));
	});

	afterEach(async () => {
		vi.useRealTimers();
		await rm(dir, { recursive: true });
	});

	it('writes mails to the preview folder instead of sending them', async () => {
		vi.useFakeTimers({ toFake: ['Date'] });
		const mailer = createPreviewMailer({ dir, from: 'Fernbill <invoices@fernbill.test>' });
		vi.setSystemTime(new Date('2026-10-31T05:00:00.000Z'));
		await mailer.send({ to: 'a@example.com', subject: 'First', text: 'Hi', html: '<p>Hi</p>' });
		vi.setSystemTime(new Date('2026-10-31T05:00:01.000Z'));
		await mailer.send({ to: 'b@example.com', subject: 'Second', text: 'Hi', html: '<p>Hi</p>' });

		const previews = await readPreviews(dir);
		expect(previews.map((mail) => mail.subject)).toEqual(['Second', 'First']);
		expect(previews[0]).toMatchObject({
			from: 'Fernbill <invoices@fernbill.test>',
			to: 'b@example.com'
		});
	});

	it('reads no previews before the first mail', async () => {
		expect(await readPreviews(join(dir, 'missing'))).toEqual([]);
	});
});
