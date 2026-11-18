CREATE TABLE `payment` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`invoice_id` integer NOT NULL,
	`amount` integer NOT NULL,
	`paid_on` text NOT NULL,
	`method` text NOT NULL,
	`note` text,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`invoice_id`) REFERENCES `invoice`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `payment_invoice_id_idx` ON `payment` (`invoice_id`);--> statement-breakpoint
ALTER TABLE `invoice` ADD `paid_on` text;