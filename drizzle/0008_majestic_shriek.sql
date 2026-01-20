CREATE TABLE `step_configurations` (
	`created_at` text DEFAULT (CURRENT_TIMESTAMP) NOT NULL,
	`custom_system_prompt` text,
	`custom_user_prompt_template` text,
	`feature_request_id` integer NOT NULL,
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`model_id` text,
	`model_provider` text,
	`step` text NOT NULL,
	`temperature` real,
	`thinking_enabled` integer DEFAULT false NOT NULL,
	`updated_at` text DEFAULT (CURRENT_TIMESTAMP) NOT NULL,
	FOREIGN KEY (`feature_request_id`) REFERENCES `feature_requests`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `step_configurations_feature_request_id_step_idx` ON `step_configurations` (`feature_request_id`,`step`);--> statement-breakpoint
CREATE INDEX `step_configurations_feature_request_id_idx` ON `step_configurations` (`feature_request_id`);