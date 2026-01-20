CREATE TABLE `ai_usage_logs` (
	`created_at` text DEFAULT (CURRENT_TIMESTAMP) NOT NULL,
	`duration_ms` integer NOT NULL,
	`error_message` text,
	`estimated_cost_usd` real NOT NULL,
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`input_tokens` integer NOT NULL,
	`model_id` text NOT NULL,
	`model_provider` text NOT NULL,
	`operation_type` text NOT NULL,
	`output_tokens` integer NOT NULL,
	`project_id` integer,
	`success` integer NOT NULL,
	`total_tokens` integer NOT NULL,
	`updated_at` text DEFAULT (CURRENT_TIMESTAMP) NOT NULL,
	FOREIGN KEY (`project_id`) REFERENCES `projects`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE INDEX `ai_usage_logs_created_at_idx` ON `ai_usage_logs` (`created_at`);--> statement-breakpoint
CREATE INDEX `ai_usage_logs_operation_type_idx` ON `ai_usage_logs` (`operation_type`);--> statement-breakpoint
CREATE INDEX `ai_usage_logs_project_id_idx` ON `ai_usage_logs` (`project_id`);