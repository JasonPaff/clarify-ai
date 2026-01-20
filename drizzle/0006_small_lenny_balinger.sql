ALTER TABLE `feature_requests` ADD `archived_at` text;--> statement-breakpoint
ALTER TABLE `feature_requests` ADD `stale_steps` text;--> statement-breakpoint
CREATE INDEX `feature_requests_archived_at_idx` ON `feature_requests` (`archived_at`);