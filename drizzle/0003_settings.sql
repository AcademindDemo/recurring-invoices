CREATE TABLE `settings` (
	`user_id` text PRIMARY KEY NOT NULL,
	`business_name` text NOT NULL,
	`address` text,
	`email` text,
	`currency` text DEFAULT 'EUR' NOT NULL,
	`default_tax_rate` integer DEFAULT 0 NOT NULL,
	`payment_terms_days` integer DEFAULT 14 NOT NULL,
	`invoice_prefix` text DEFAULT 'INV' NOT NULL,
	`payment_instructions` text,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade
);
