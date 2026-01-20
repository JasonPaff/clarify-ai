CREATE TABLE `feature_request_runs` (
	`completed_at` text,
	`created_at` text DEFAULT (CURRENT_TIMESTAMP) NOT NULL,
	`duration_ms` integer,
	`error_message` text,
	`feature_request_id` integer NOT NULL,
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`input_content` text NOT NULL,
	`input_tokens` integer,
	`model_id` text NOT NULL,
	`output_content` text,
	`output_tokens` integer,
	`started_at` text,
	`status` text DEFAULT 'pending' NOT NULL,
	`step` text NOT NULL,
	`updated_at` text DEFAULT (CURRENT_TIMESTAMP) NOT NULL,
	FOREIGN KEY (`feature_request_id`) REFERENCES `feature_requests`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `feature_request_runs_feature_request_id_idx` ON `feature_request_runs` (`feature_request_id`);--> statement-breakpoint
CREATE INDEX `feature_request_runs_status_idx` ON `feature_request_runs` (`status`);--> statement-breakpoint
CREATE INDEX `feature_request_runs_step_idx` ON `feature_request_runs` (`step`);