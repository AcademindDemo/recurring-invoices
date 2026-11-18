import { beforeEach, describe, expect, it } from 'vitest';
import type { Db } from '../db/client.ts';
import { job } from '../db/schema.ts';
import { createTestDb } from '../db/testing.ts';
import { createTestMailer } from '../email/testing.ts';
import {
	enqueue,
	MAX_ATTEMPTS,
	retryDelay,
	runDueJobs,
	type JobHandlers,
	type JobServices
} from './runner.ts';

const now = new Date('2026-07-01T06:00:00Z');
const minutesLater = (minutes: number) => new Date(now.getTime() + minutes * 60_000);

describe('runDueJobs', () => {
	let db: Db;
	let services: JobServices;
	let ran: unknown[];
	const handlers: JobHandlers = {
		record: ({ payload }) => {
			ran.push(payload);
		},
		mail: ({ mailer, origin }) =>
			mailer.send({ to: 'ana@example.com', subject: 'Hello', text: origin, html: origin }),
		explode: () => {
			throw new Error('SMTP timed out');
		}
	};

	beforeEach(() => {
		db = createTestDb();
		services = { db, mailer: createTestMailer(), origin: 'https://fernbill.test' };
		ran = [];
	});

	it('runs due jobs once, oldest first', async () => {
		enqueue(db, 'record', { n: 2 }, { runAt: minutesLater(-1) });
		enqueue(db, 'record', { n: 1 }, { runAt: minutesLater(-5) });

		expect(await runDueJobs(services, handlers, now)).toEqual({ done: 2, retried: 0, failed: 0 });
		expect(await runDueJobs(services, handlers, now)).toEqual({ done: 0, retried: 0, failed: 0 });
		expect(ran).toEqual([{ n: 1 }, { n: 2 }]);
	});

	it('leaves jobs that are not due yet', async () => {
		enqueue(db, 'record', {}, { runAt: minutesLater(10) });

		await runDueJobs(services, handlers, now);

		expect(ran).toEqual([]);
	});

	it('retries a failing job on later runs, then gives up', async () => {
		enqueue(db, 'explode', {}, { runAt: now });

		let runAt = now;
		for (let attempt = 1; attempt < MAX_ATTEMPTS; attempt++) {
			expect(await runDueJobs(services, handlers, runAt)).toMatchObject({ retried: 1 });
			runAt = new Date(runAt.getTime() + retryDelay(attempt));
		}
		expect(await runDueJobs(services, handlers, runAt)).toMatchObject({ failed: 1 });

		expect(db.select().from(job).get()).toMatchObject({
			status: 'failed',
			attempts: MAX_ATTEMPTS,
			lastError: 'SMTP timed out'
		});
	});

	it('waits longer after each failed attempt', async () => {
		enqueue(db, 'explode', {}, { runAt: now });
		await runDueJobs(services, handlers, now);

		expect(await runDueJobs(services, handlers, minutesLater(4))).toMatchObject({ retried: 0 });
		expect(await runDueJobs(services, handlers, minutesLater(5))).toMatchObject({ retried: 1 });
		expect(await runDueJobs(services, handlers, minutesLater(24))).toMatchObject({ retried: 0 });
		expect(await runDueJobs(services, handlers, minutesLater(25))).toMatchObject({ retried: 1 });
	});

	it('gives handlers the mailer and the app’s URL', async () => {
		const mailer = createTestMailer();
		enqueue(db, 'mail', {}, { runAt: now });

		await runDueJobs({ ...services, mailer }, handlers, now);

		expect(mailer.sent).toMatchObject([{ to: 'ana@example.com', text: 'https://fernbill.test' }]);
	});

	it('fails jobs nobody handles', async () => {
		enqueue(db, 'unknown', {}, { runAt: now });

		await runDueJobs(services, handlers, now);

		expect(db.select().from(job).get()?.lastError).toBe('No handler for job type "unknown"');
	});
});

describe('enqueue', () => {
	it('queues a job with a key only once', () => {
		const db = createTestDb();

		enqueue(db, 'record', {}, { key: 'record:2026-07-01' });
		enqueue(db, 'record', {}, { key: 'record:2026-07-01' });

		expect(db.select().from(job).all()).toHaveLength(1);
	});
});
