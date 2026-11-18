CREATE TABLE `job` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`type` text NOT NULL,
	`key` text,
	`payload` text NOT NULL,
	`run_at` integer NOT NULL,
	`status` text DEFAULT 'queued' NOT NULL,
	`attempts` integer DEFAULT 0 NOT NULL,
	`last_error` text,
	`created_at` integer NOT NULL,
	`finished_at` integer
);
--> statement-breakpoint
CREATE UNIQUE INDEX `job_key_unique` ON `job` (`key`);--> statement-breakpoint
CREATE INDEX `job_status_run_at_idx` ON `job` (`status`,`run_at`);