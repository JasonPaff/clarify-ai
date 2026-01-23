CREATE TABLE `ai_logs` (
	`completed_at` text,
	`created_at` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')) NOT NULL,
	`duration_ms` integer,
	`error_message` text,
	`feature_request_id` integer,
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`input_tokens` integer,
	`model_id` text NOT NULL,
	`output_tokens` integer,
	`project_id` integer,
	`reasoning_tokens` integer,
	`request_body` text,
	`request_id` text NOT NULL,
	`response_body` text,
	`started_at` text,
	`status` text DEFAULT 'pending' NOT NULL,
	`stream_chunks` text,
	`tool_calls` text,
	`updated_at` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')) NOT NULL,
	`workflow_step` text,
	FOREIGN KEY (`feature_request_id`) REFERENCES `feature_requests`(`id`) ON UPDATE no action ON DELETE set null,
	FOREIGN KEY (`project_id`) REFERENCES `projects`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE UNIQUE INDEX `ai_logs_request_id_unique` ON `ai_logs` (`request_id`);--> statement-breakpoint
CREATE INDEX `ai_logs_created_at_idx` ON `ai_logs` (`created_at`);--> statement-breakpoint
CREATE INDEX `ai_logs_feature_request_id_idx` ON `ai_logs` (`feature_request_id`);--> statement-breakpoint
CREATE INDEX `ai_logs_model_id_idx` ON `ai_logs` (`model_id`);--> statement-breakpoint
CREATE INDEX `ai_logs_project_id_idx` ON `ai_logs` (`project_id`);--> statement-breakpoint
CREATE INDEX `ai_logs_request_id_idx` ON `ai_logs` (`request_id`);--> statement-breakpoint
CREATE INDEX `ai_logs_status_idx` ON `ai_logs` (`status`);--> statement-breakpoint
CREATE INDEX `ai_logs_workflow_step_idx` ON `ai_logs` (`workflow_step`);