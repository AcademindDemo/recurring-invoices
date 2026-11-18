ALTER TABLE `recurring_schedule` ADD `next_billing_on` text;--> statement-breakpoint
CREATE INDEX `recurring_schedule_status_next_billing_on_idx` ON `recurring_schedule` (`status`,`next_billing_on`);--> statement-breakpoint
UPDATE `recurring_schedule` SET `next_billing_on` = `first_billing_date` WHERE `status` <> 'ended';
