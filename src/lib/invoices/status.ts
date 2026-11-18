export const invoiceStatuses = ['draft', 'sent', 'paid', 'overdue'] as const;

export type InvoiceStatus = (typeof invoiceStatuses)[number];

export const statusLabels: Record<InvoiceStatus, string> = {
	draft: 'Draft',
	sent: 'Sent',
	paid: 'Paid',
	overdue: 'Overdue'
};
