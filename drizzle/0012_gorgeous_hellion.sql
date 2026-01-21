PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_step_configurations` (
	`created_at` text DEFAULT (CURRENT_TIMESTAMP) NOT NULL,
	`custom_system_prompt` text,
	`custom_user_prompt_template` text,
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`max_tokens` integer,
	`model_id` text,
	`model_provider` text,
	`project_id` integer NOT NULL,
	`step` text NOT NULL,
	`temperature` real,
	`thinking_budget` integer,
	`thinking_enabled` integer DEFAULT false NOT NULL,
	`updated_at` text DEFAULT (CURRENT_TIMESTAMP) NOT NULL,
	FOREIGN KEY (`project_id`) REFERENCES `projects`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
DROP TABLE `step_configurations`;--> statement-breakpoint
ALTER TABLE `__new_step_configurations` RENAME TO `step_configurations`;--> statement-breakpoint
PRAGMA foreign_keys=ON;--> statement-breakpoint
CREATE UNIQUE INDEX `step_configurations_project_id_step_idx` ON `step_configurations` (`project_id`,`step`);--> statement-breakpoint
CREATE INDEX `step_configurations_project_id_idx` ON `step_configurations` (`project_id`);