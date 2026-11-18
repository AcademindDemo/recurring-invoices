import { relations } from 'drizzle-orm';
import { index, integer, real, sqliteTable, text, uniqueIndex } from 'drizzle-orm/sqlite-core';
import { paymentMethods } from '../../invoices/payments.ts';
import { invoiceStatuses } from '../../invoices/status.ts';
import { user } from './auth.schema.ts';

export * from './auth.schema.ts';

const createdAt = () =>
	integer('created_at', { mode: 'timestamp_ms' })
		.notNull()
		.$defaultFn(() => new Date());

export const client = sqliteTable(
	'client',
	{
		id: integer('id').primaryKey({ autoIncrement: true }),
		userId: text('user_id')
			.notNull()
			.references(() => user.id, { onDelete: 'cascade' }),
		name: text('name').notNull(),
		email: text('email'),
		address: text('address'),
		createdAt: createdAt()
	},
	(table) => [index('client_user_id_idx').on(table.userId)]
);

export const invoice = sqliteTable(
	'invoice',
	{
		id: integer('id').primaryKey({ autoIncrement: true }),
		userId: text('user_id')
			.notNull()
			.references(() => user.id, { onDelete: 'cascade' }),
		clientId: integer('client_id')
			.notNull()
			.references(() => client.id),
		number: text('number').notNull(),
		numberYear: integer('number_year').notNull(),
		numberSequence: integer('number_sequence').notNull(),
		status: text('status', { enum: invoiceStatuses }).notNull().default('draft'),
		// Calendar dates as YYYY-MM-DD
		issueDate: text('issue_date').notNull(),
		dueDate: text('due_date').notNull(),
		currency: text('currency').notNull(),
		// Basis points: 1900 is 19 %
		taxRate: integer('tax_rate').notNull(),
		subtotal: integer('subtotal').notNull(),
		tax: integer('tax').notNull(),
		total: integer('total').notNull(),
		notes: text('notes'),
		sentAt: integer('sent_at', { mode: 'timestamp_ms' }),
		// The date of the payment that covered the total
		paidOn: text('paid_on'),
		scheduleId: integer('schedule_id').references(() => recurringSchedule.id),
		createdAt: createdAt()
	},
	(table) => [
		uniqueIndex('invoice_number_idx').on(table.userId, table.numberYear, table.numberSequence),
		index('invoice_client_id_idx').on(table.clientId)
	]
);

export const invoiceLine = sqliteTable(
	'invoice_line',
	{
		id: integer('id').primaryKey({ autoIncrement: true }),
		invoiceId: integer('invoice_id')
			.notNull()
			.references(() => invoice.id, { onDelete: 'cascade' }),
		position: integer('position').notNull(),
		description: text('description').notNull(),
		quantity: real('quantity').notNull(),
		unitPrice: integer('unit_price').notNull(),
		amount: integer('amount').notNull()
	},
	(table) => [index('invoice_line_invoice_id_idx').on(table.invoiceId)]
);

export const payment = sqliteTable(
	'payment',
	{
		id: integer('id').primaryKey({ autoIncrement: true }),
		invoiceId: integer('invoice_id')
			.notNull()
			.references(() => invoice.id, { onDelete: 'cascade' }),
		// Cents, in the invoice's currency
		amount: integer('amount').notNull(),
		paidOn: text('paid_on').notNull(),
		method: text('method', { enum: paymentMethods }).notNull(),
		note: text('note'),
		createdAt: createdAt()
	},
	(table) => [index('payment_invoice_id_idx').on(table.invoiceId)]
);

export const settings = sqliteTable('settings', {
	userId: text('user_id')
		.primaryKey()
		.references(() => user.id, { onDelete: 'cascade' }),
	businessName: text('business_name').notNull(),
	address: text('address'),
	email: text('email'),
	currency: text('currency').notNull().default('EUR'),
	// Basis points, like invoice.tax_rate
	defaultTaxRate: integer('default_tax_rate').notNull().default(0),
	paymentTermsDays: integer('payment_terms_days').notNull().default(14),
	invoicePrefix: text('invoice_prefix').notNull().default('INV'),
	paymentInstructions: text('payment_instructions'),
	// IANA name, like Europe/Berlin
	timeZone: text('time_zone').notNull().default('UTC')
});

export const scheduleStatuses = ['active', 'paused', 'ended'] as const;

export const recurringSchedule = sqliteTable(
	'recurring_schedule',
	{
		id: integer('id').primaryKey({ autoIncrement: true }),
		userId: text('user_id')
			.notNull()
			.references(() => user.id, { onDelete: 'cascade' }),
		clientId: integer('client_id')
			.notNull()
			.references(() => client.id),
		// 1 for monthly, 12 for yearly
		intervalMonths: integer('interval_months').notNull(),
		// YYYY-MM-DD; later billing dates keep its day of the month
		firstBillingDate: text('first_billing_date').notNull(),
		taxRate: integer('tax_rate').notNull(),
		notes: text('notes'),
		status: text('status', { enum: scheduleStatuses }).notNull().default('active'),
		createdAt: createdAt()
	},
	(table) => [index('recurring_schedule_user_id_idx').on(table.userId)]
);

export const recurringScheduleLine = sqliteTable(
	'recurring_schedule_line',
	{
		id: integer('id').primaryKey({ autoIncrement: true }),
		scheduleId: integer('schedule_id')
			.notNull()
			.references(() => recurringSchedule.id, { onDelete: 'cascade' }),
		position: integer('position').notNull(),
		description: text('description').notNull(),
		quantity: real('quantity').notNull(),
		unitPrice: integer('unit_price').notNull()
	},
	(table) => [index('recurring_schedule_line_schedule_id_idx').on(table.scheduleId)]
);

export const jobStatuses = ['queued', 'running', 'done', 'failed'] as const;

export const job = sqliteTable(
	'job',
	{
		id: integer('id').primaryKey({ autoIncrement: true }),
		type: text('type').notNull(),
		// Set for jobs that must only be queued once, e.g. mark-overdue:2026-07-01
		key: text('key').unique(),
		payload: text('payload', { mode: 'json' }).notNull().$type<unknown>(),
		runAt: integer('run_at', { mode: 'timestamp_ms' }).notNull(),
		status: text('status', { enum: jobStatuses }).notNull().default('queued'),
		attempts: integer('attempts').notNull().default(0),
		lastError: text('last_error'),
		createdAt: createdAt(),
		finishedAt: integer('finished_at', { mode: 'timestamp_ms' })
	},
	(table) => [index('job_status_run_at_idx').on(table.status, table.runAt)]
);

export const clientRelations = relations(client, ({ many }) => ({
	invoices: many(invoice)
}));

export const invoiceRelations = relations(invoice, ({ one, many }) => ({
	client: one(client, { fields: [invoice.clientId], references: [client.id] }),
	schedule: one(recurringSchedule, {
		fields: [invoice.scheduleId],
		references: [recurringSchedule.id]
	}),
	lines: many(invoiceLine),
	payments: many(payment)
}));

export const invoiceLineRelations = relations(invoiceLine, ({ one }) => ({
	invoice: one(invoice, { fields: [invoiceLine.invoiceId], references: [invoice.id] })
}));

export const paymentRelations = relations(payment, ({ one }) => ({
	invoice: one(invoice, { fields: [payment.invoiceId], references: [invoice.id] })
}));

export const recurringScheduleRelations = relations(recurringSchedule, ({ one, many }) => ({
	client: one(client, { fields: [recurringSchedule.clientId], references: [client.id] }),
	lines: many(recurringScheduleLine),
	invoices: many(invoice)
}));

export const recurringScheduleLineRelations = relations(recurringScheduleLine, ({ one }) => ({
	schedule: one(recurringSchedule, {
		fields: [recurringScheduleLine.scheduleId],
		references: [recurringSchedule.id]
	})
}));

export type Client = typeof client.$inferSelect;
export type Invoice = typeof invoice.$inferSelect;
export type InvoiceLine = typeof invoiceLine.$inferSelect;
export type Payment = typeof payment.$inferSelect;
export type Settings = typeof settings.$inferSelect;
export type Job = typeof job.$inferSelect;
export type RecurringSchedule = typeof recurringSchedule.$inferSelect;
export type RecurringScheduleLine = typeof recurringScheduleLine.$inferSelect;
