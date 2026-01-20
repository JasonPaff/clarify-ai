ALTER TABLE `feature_request_runs` ADD `estimated_cost` real;--> statement-breakpoint
ALTER TABLE `feature_request_runs` ADD `is_current_run` integer DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE `feature_request_runs` ADD `parameters` text;--> statement-breakpoint
ALTER TABLE `feature_request_runs` ADD `prompt_used` text;--> statement-breakpoint
CREATE INDEX `feature_request_runs_current_run_idx` ON `feature_request_runs` (`feature_request_id`,`step`,`is_current_run`);--> statement-breakpoint
ALTER TABLE `step_configurations` ADD `max_tokens` integer;