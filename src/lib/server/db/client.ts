import Database, { type RunResult } from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import type { BaseSQLiteDatabase } from 'drizzle-orm/sqlite-core';
import * as schema from './schema.ts';

export function createDb(url: string) {
	const sqlite = new Database(url);
	sqlite.pragma('journal_mode = WAL');
	sqlite.pragma('foreign_keys = ON');
	return drizzle(sqlite, { schema });
}

export type Db = ReturnType<typeof createDb>;

/** The database or a transaction on it. */
export type Queryable = BaseSQLiteDatabase<'sync', RunResult, typeof schema>;
