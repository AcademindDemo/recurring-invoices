import { listClients } from '#lib/server/clients.ts';
import { db } from '#lib/server/db/index.ts';
import { requireUser } from '#lib/server/session.ts';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = ({ url }) => {
	const user = requireUser();
	const search = url.searchParams.get('q') ?? '';
	return { search, clients: listClients(db, user.id, search) };
};
