PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_feature_request_context_files` (
	`created_at` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')) NOT NULL,
	`display_name` text NOT NULL,
	`feature_request_id` integer NOT NULL,
	`file_path` text NOT NULL,
	`file_type` text NOT NULL,
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`included_in_context` integer DEFAULT true NOT NULL,
	`size_bytes` integer NOT NULL,
	`updated_at` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')) NOT NULL,
	FOREIGN KEY (`feature_request_id`) REFERENCES `feature_requests`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
INSERT INTO `__new_feature_request_context_files`("created_at", "display_name", "feature_request_id", "file_path", "file_type", "id", "included_in_context", "size_bytes", "updated_at") SELECT "created_at", "display_name", "feature_request_id", "file_path", "file_type", "id", "included_in_context", "size_bytes", "updated_at" FROM `feature_request_context_files`;--> statement-breakpoint
DROP TABLE `feature_request_context_files`;--> statement-breakpoint
ALTER TABLE `__new_feature_request_context_files` RENAME TO `feature_request_context_files`;--> statement-breakpoint
PRAGMA foreign_keys=ON;--> statement-breakpoint
CREATE UNIQUE INDEX `feature_request_context_files_feature_request_id_file_path_idx` ON `feature_request_context_files` (`feature_request_id`,`file_path`);--> statement-breakpoint
CREATE INDEX `feature_request_context_files_feature_request_id_idx` ON `feature_request_context_files` (`feature_request_id`);--> statement-breakpoint
CREATE INDEX `feature_request_context_files_file_type_idx` ON `feature_request_context_files` (`file_type`);--> statement-breakpoint
CREATE TABLE `__new_feature_request_repositories` (
	`created_at` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')) NOT NULL,
	`feature_request_id` integer NOT NULL,
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`repository_id` integer NOT NULL,
	FOREIGN KEY (`feature_request_id`) REFERENCES `feature_requests`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`repository_id`) REFERENCES `repositories`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
INSERT INTO `__new_feature_request_repositories`("created_at", "feature_request_id", "id", "repository_id") SELECT "created_at", "feature_request_id", "id", "repository_id" FROM `feature_request_repositories`;--> statement-breakpoint
DROP TABLE `feature_request_repositories`;--> statement-breakpoint
ALTER TABLE `__new_feature_request_repositories` RENAME TO `feature_request_repositories`;--> statement-breakpoint
CREATE UNIQUE INDEX `feature_request_repositories_feature_request_id_repository_id_idx` ON `feature_request_repositories` (`feature_request_id`,`repository_id`);--> statement-breakpoint
CREATE INDEX `feature_request_repositories_feature_request_id_idx` ON `feature_request_repositories` (`feature_request_id`);--> statement-breakpoint
CREATE INDEX `feature_request_repositories_repository_id_idx` ON `feature_request_repositories` (`repository_id`);--> statement-breakpoint
CREATE TABLE `__new_feature_request_runs` (
	`completed_at` text,
	`created_at` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')) NOT NULL,
	`duration_ms` integer,
	`error_message` text,
	`estimated_cost` real,
	`feature_request_id` integer NOT NULL,
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`input_content` text NOT NULL,
	`input_tokens` integer,
	`is_current_run` integer DEFAULT false NOT NULL,
	`model_id` text NOT NULL,
	`output_content` text,
	`output_tokens` integer,
	`parameters` text,
	`prompt_used` text,
	`started_at` text,
	`status` text DEFAULT 'pending' NOT NULL,
	`step` text NOT NULL,
	`updated_at` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')) NOT NULL,
	FOREIGN KEY (`feature_request_id`) REFERENCES `feature_requests`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
INSERT INTO `__new_feature_request_runs`("completed_at", "created_at", "duration_ms", "error_message", "estimated_cost", "feature_request_id", "id", "input_content", "input_tokens", "is_current_run", "model_id", "output_content", "output_tokens", "parameters", "prompt_used", "started_at", "status", "step", "updated_at") SELECT "completed_at", "created_at", "duration_ms", "error_message", "estimated_cost", "feature_request_id", "id", "input_content", "input_tokens", "is_current_run", "model_id", "output_content", "output_tokens", "parameters", "prompt_used", "started_at", "status", "step", "updated_at" FROM `feature_request_runs`;--> statement-breakpoint
DROP TABLE `feature_request_runs`;--> statement-breakpoint
ALTER TABLE `__new_feature_request_runs` RENAME TO `feature_request_runs`;--> statement-breakpoint
CREATE INDEX `feature_request_runs_current_run_idx` ON `feature_request_runs` (`feature_request_id`,`step`,`is_current_run`);--> statement-breakpoint
CREATE INDEX `feature_request_runs_feature_request_id_idx` ON `feature_request_runs` (`feature_request_id`);--> statement-breakpoint
CREATE INDEX `feature_request_runs_status_idx` ON `feature_request_runs` (`status`);--> statement-breakpoint
CREATE INDEX `feature_request_runs_step_idx` ON `feature_request_runs` (`step`);--> statement-breakpoint
CREATE TABLE `__new_feature_requests` (
	`archived_at` text,
	`clarification_analysis` text,
	`clarification_answers` text,
	`clarification_detail_score` integer,
	`clarification_model` text,
	`clarification_prompt` text,
	`clarification_questions` text,
	`clarification_status` text,
	`created_at` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')) NOT NULL,
	`description` text,
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`implementation_plan` text,
	`project_id` integer NOT NULL,
	`raw_request` text,
	`refined_requirements` text,
	`research_findings` text,
	`stale_steps` text,
	`status` text DEFAULT 'draft' NOT NULL,
	`title` text NOT NULL,
	`updated_at` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')) NOT NULL,
	FOREIGN KEY (`project_id`) REFERENCES `projects`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
INSERT INTO `__new_feature_requests`("archived_at", "clarification_analysis", "clarification_answers", "clarification_detail_score", "clarification_model", "clarification_prompt", "clarification_questions", "clarification_status", "created_at", "description", "id", "implementation_plan", "project_id", "raw_request", "refined_requirements", "research_findings", "stale_steps", "status", "title", "updated_at") SELECT "archived_at", "clarification_analysis", "clarification_answers", "clarification_detail_score", "clarification_model", "clarification_prompt", "clarification_questions", "clarification_status", "created_at", "description", "id", "implementation_plan", "project_id", "raw_request", "refined_requirements", "research_findings", "stale_steps", "status", "title", "updated_at" FROM `feature_requests`;--> statement-breakpoint
DROP TABLE `feature_requests`;--> statement-breakpoint
ALTER TABLE `__new_feature_requests` RENAME TO `feature_requests`;--> statement-breakpoint
CREATE INDEX `feature_requests_archived_at_idx` ON `feature_requests` (`archived_at`);--> statement-breakpoint
CREATE INDEX `feature_requests_project_id_idx` ON `feature_requests` (`project_id`);--> statement-breakpoint
CREATE INDEX `feature_requests_status_idx` ON `feature_requests` (`status`);--> statement-breakpoint
CREATE TABLE `__new_projects` (
	`created_at` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')) NOT NULL,
	`description` text,
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`is_favorited` integer DEFAULT false NOT NULL,
	`name` text NOT NULL,
	`plan_export_folder` text,
	`updated_at` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')) NOT NULL
);
--> statement-breakpoint
INSERT INTO `__new_projects`("created_at", "description", "id", "is_favorited", "name", "plan_export_folder", "updated_at") SELECT "created_at", "description", "id", "is_favorited", "name", "plan_export_folder", "updated_at" FROM `projects`;--> statement-breakpoint
DROP TABLE `projects`;--> statement-breakpoint
ALTER TABLE `__new_projects` RENAME TO `projects`;--> statement-breakpoint
CREATE INDEX `projects_created_at_idx` ON `projects` (`created_at`);--> statement-breakpoint
CREATE INDEX `projects_is_favorited_idx` ON `projects` (`is_favorited`);--> statement-breakpoint
CREATE INDEX `projects_name_idx` ON `projects` (`name`);--> statement-breakpoint
CREATE INDEX `projects_updated_at_idx` ON `projects` (`updated_at`);--> statement-breakpoint
CREATE TABLE `__new_repositories` (
	`created_at` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')) NOT NULL,
	`file_count` integer,
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`last_scanned_at` text,
	`name` text NOT NULL,
	`path` text NOT NULL,
	`project_id` integer NOT NULL,
	`updated_at` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')) NOT NULL,
	FOREIGN KEY (`project_id`) REFERENCES `projects`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
INSERT INTO `__new_repositories`("created_at", "file_count", "id", "last_scanned_at", "name", "path", "project_id", "updated_at") SELECT "created_at", "file_count", "id", "last_scanned_at", "name", "path", "project_id", "updated_at" FROM `repositories`;--> statement-breakpoint
DROP TABLE `repositories`;--> statement-breakpoint
ALTER TABLE `__new_repositories` RENAME TO `repositories`;--> statement-breakpoint
CREATE INDEX `repositories_project_id_idx` ON `repositories` (`project_id`);--> statement-breakpoint
CREATE INDEX `repositories_path_idx` ON `repositories` (`path`);--> statement-breakpoint
CREATE TABLE `__new_repository_overviews` (
	`content` text NOT NULL,
	`created_at` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')) NOT NULL,
	`generated_at` text NOT NULL,
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`last_edited_at` text,
	`manual_content` text,
	`model_id` text NOT NULL,
	`prompt_used` text NOT NULL,
	`repository_id` integer NOT NULL,
	`updated_at` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')) NOT NULL,
	FOREIGN KEY (`repository_id`) REFERENCES `repositories`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
INSERT INTO `__new_repository_overviews`("content", "created_at", "generated_at", "id", "last_edited_at", "manual_content", "model_id", "prompt_used", "repository_id", "updated_at") SELECT "content", "created_at", "generated_at", "id", "last_edited_at", "manual_content", "model_id", "prompt_used", "repository_id", "updated_at" FROM `repository_overviews`;--> statement-breakpoint
DROP TABLE `repository_overviews`;--> statement-breakpoint
ALTER TABLE `__new_repository_overviews` RENAME TO `repository_overviews`;--> statement-breakpoint
CREATE UNIQUE INDEX `repository_overviews_repository_id_unique` ON `repository_overviews` (`repository_id`);--> statement-breakpoint
CREATE INDEX `repository_overviews_repository_id_idx` ON `repository_overviews` (`repository_id`);--> statement-breakpoint
CREATE TABLE `__new_step_configurations` (
	`created_at` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')) NOT NULL,
	`custom_system_prompt` text,
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`max_tokens` integer,
	`model_id` text,
	`model_provider` text,
	`project_id` integer NOT NULL,
	`step` text NOT NULL,
	`temperature` real,
	`thinking_budget` integer,
	`thinking_enabled` integer DEFAULT false NOT NULL,
	`updated_at` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')) NOT NULL,
	FOREIGN KEY (`project_id`) REFERENCES `projects`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
INSERT INTO `__new_step_configurations`("created_at", "custom_system_prompt", "id", "max_tokens", "model_id", "model_provider", "project_id", "step", "temperature", "thinking_budget", "thinking_enabled", "updated_at") SELECT "created_at", "custom_system_prompt", "id", "max_tokens", "model_id", "model_provider", "project_id", "step", "temperature", "thinking_budget", "thinking_enabled", "updated_at" FROM `step_configurations`;--> statement-breakpoint
DROP TABLE `step_configurations`;--> statement-breakpoint
ALTER TABLE `__new_step_configurations` RENAME TO `step_configurations`;--> statement-breakpoint
CREATE UNIQUE INDEX `step_configurations_project_id_step_idx` ON `step_configurations` (`project_id`,`step`);--> statement-breakpoint
CREATE INDEX `step_configurations_project_id_idx` ON `step_configurations` (`project_id`);