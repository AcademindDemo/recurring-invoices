export const paymentMethods = ['bank_transfer', 'card', 'cash', 'other'] as const;

export type PaymentMethod = (typeof paymentMethods)[number];

export const paymentMethodLabels: Record<PaymentMethod, string> = {
	bank_transfer: 'Bank transfer',
	card: 'Card',
	cash: 'Cash',
	other: 'Other'
};
