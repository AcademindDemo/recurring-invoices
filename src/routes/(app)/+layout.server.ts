import { requireUser } from '#lib/server/session.ts';
import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = () => {
	const { name, email } = requireUser();
	return { user: { name, email } };
};
