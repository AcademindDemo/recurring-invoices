import { migrate } from 'drizzle-orm/better-sqlite3/migrator';
import { createDb, type Db } from './client.ts';
import { client, user } from './schema.ts';

/** A fresh in-memory database with all migrations applied. */
export function createTestDb() {
	const db = createDb(':memory:');
	migrate(db, { migrationsFolder: 'drizzle' });
	return db;
}

export function createTestUser(db: Db, name = 'Ana Silva') {
	return db
		.insert(user)
		.values({
			id: crypto.randomUUID(),
			name,
			email: `${crypto.randomUUID()}@example.com`
		})
		.returning()
		.get();
}

export function createTestClient(db: Db, userId: string, name = 'Kauri Studio') {
	return db
		.insert(client)
		.values({ userId, name, email: 'accounts@kauri.example' })
		.returning()
		.get();
}
