import { describe, expect, it } from 'vitest';
import { job } from '../db/schema.ts';
import { createTestDb } from '../db/testing.ts';
import { enqueueDailyJobs } from './index.ts';

describe('enqueueDailyJobs', () => {
	it('queues each daily job once per day', () => {
		const db = createTestDb();

		enqueueDailyJobs(db, new Date('2026-07-02T06:00:00Z'));
		enqueueDailyJobs(db, new Date('2026-07-02T06:05:00Z'));
		enqueueDailyJobs(db, new Date('2026-07-03T06:00:00Z'));

		expect(db.select({ key: job.key }).from(job).all()).toEqual([
			{ key: 'mark-overdue:2026-07-02' },
			{ key: 'mark-overdue:2026-07-03' }
		]);
	});
});
