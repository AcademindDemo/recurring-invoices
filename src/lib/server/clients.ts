import { and, asc, count, eq, getTableColumns, like, or } from 'drizzle-orm';
import { z } from 'zod';
import type { Db } from './db/client.ts';
import { client, invoice } from './db/schema.ts';

export const clientInput = z.object({
	name: z.string().trim().min(1, 'Enter the client’s name.'),
	email: z
		.string()
		.trim()
		.refine((email) => email === '' || z.email().safeParse(email).success, {
			message: 'Enter an email address like name@example.com, or leave it empty.'
		}),
	address: z.string().trim()
});

export type ClientInput = z.infer<typeof clientInput>;

/** The user's clients by name, optionally only those whose name or email contains `search`. */
/** The user's clients by name, each with how many invoices they have had. */
export function listClients(db: Db, userId: string, search = '') {
	const pattern = `%${search.trim()}%`;
	return db
		.select({ ...getTableColumns(client), invoiceCount: count(invoice.id) })
		.from(client)
		.leftJoin(invoice, eq(invoice.clientId, client.id))
		.where(
			and(
				eq(client.userId, userId),
				search.trim() ? or(like(client.name, pattern), like(client.email, pattern)) : undefined
			)
		)
		.groupBy(client.id)
		.orderBy(asc(client.name))
		.all();
}

export function getClient(db: Db, userId: string, id: number) {
	return db
		.select()
		.from(client)
		.where(and(eq(client.userId, userId), eq(client.id, id)))
		.get();
}

export function createClient(db: Db, userId: string, input: ClientInput) {
	return db
		.insert(client)
		.values({ userId, ...nullIfEmpty(input) })
		.returning()
		.get();
}

export function updateClient(db: Db, userId: string, id: number, input: ClientInput) {
	return db
		.update(client)
		.set(nullIfEmpty(input))
		.where(and(eq(client.userId, userId), eq(client.id, id)))
		.returning()
		.get();
}

function nullIfEmpty({ name, email, address }: ClientInput) {
	return { name, email: email || null, address: address || null };
}
