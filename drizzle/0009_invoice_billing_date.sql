ALTER TABLE `invoice` ADD `billing_date` text;--> statement-breakpoint
CREATE UNIQUE INDEX `invoice_schedule_billing_date_idx` ON `invoice` (`schedule_id`,`billing_date`);