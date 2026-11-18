CREATE TABLE `invoice` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`user_id` text NOT NULL,
	`client_id` integer NOT NULL,
	`number` text NOT NULL,
	`number_year` integer NOT NULL,
	`number_sequence` integer NOT NULL,
	`status` text DEFAULT 'draft' NOT NULL,
	`issue_date` text NOT NULL,
	`due_date` text NOT NULL,
	`currency` text NOT NULL,
	`tax_rate` integer NOT NULL,
	`subtotal` integer NOT NULL,
	`tax` integer NOT NULL,
	`total` integer NOT NULL,
	`notes` text,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`client_id`) REFERENCES `client`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `invoice_number_idx` ON `invoice` (`user_id`,`number_year`,`number_sequence`);--> statement-breakpoint
CREATE INDEX `invoice_client_id_idx` ON `invoice` (`client_id`);--> statement-breakpoint
CREATE TABLE `invoice_line` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`invoice_id` integer NOT NULL,
	`position` integer NOT NULL,
	`description` text NOT NULL,
	`quantity` real NOT NULL,
	`unit_price` integer NOT NULL,
	`amount` integer NOT NULL,
	FOREIGN KEY (`invoice_id`) REFERENCES `invoice`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `invoice_line_invoice_id_idx` ON `invoice_line` (`invoice_id`);