CREATE TABLE `recurring_schedule` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`user_id` text NOT NULL,
	`client_id` integer NOT NULL,
	`interval_months` integer NOT NULL,
	`first_billing_date` text NOT NULL,
	`tax_rate` integer NOT NULL,
	`notes` text,
	`status` text DEFAULT 'active' NOT NULL,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`client_id`) REFERENCES `client`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `recurring_schedule_user_id_idx` ON `recurring_schedule` (`user_id`);--> statement-breakpoint
CREATE TABLE `recurring_schedule_line` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`schedule_id` integer NOT NULL,
	`position` integer NOT NULL,
	`description` text NOT NULL,
	`quantity` real NOT NULL,
	`unit_price` integer NOT NULL,
	FOREIGN KEY (`schedule_id`) REFERENCES `recurring_schedule`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `recurring_schedule_line_schedule_id_idx` ON `recurring_schedule_line` (`schedule_id`);--> statement-breakpoint
ALTER TABLE `invoice` ADD `schedule_id` integer REFERENCES recurring_schedule(id);