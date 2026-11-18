export const invoiceSorts = ['newest', 'due', 'amount'] as const;

export type InvoiceSort = (typeof invoiceSorts)[number];

export const sortLabels: Record<InvoiceSort, string> = {
	newest: 'Newest',
	due: 'Due date',
	amount: 'Amount'
};
