import { invoiceSorts } from '#lib/invoices/sort.ts';
import { invoiceStatuses } from '#lib/invoices/status.ts';
import { db } from '#lib/server/db/index.ts';
import { listInvoices } from '#lib/server/invoices/invoices.ts';
import { requireUser } from '#lib/server/session.ts';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = ({ url }) => {
	const user = requireUser();
	const status = oneOf(invoiceStatuses, url.searchParams.get('status'));
	const sort = oneOf(invoiceSorts, url.searchParams.get('sort'));
	return { status, sort, invoices: listInvoices(db, user.id, { status, sort }) };
};

function oneOf<T extends string>(options: readonly T[], value: string | null) {
	return options.find((option) => option === value);
}
