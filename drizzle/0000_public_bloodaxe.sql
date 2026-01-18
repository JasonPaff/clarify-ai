CREATE TABLE `projects` (
	`created_at` text DEFAULT (CURRENT_TIMESTAMP) NOT NULL,
	`description` text,
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`updated_at` text DEFAULT (CURRENT_TIMESTAMP) NOT NULL
);
--> statement-breakpoint
CREATE INDEX `projects_name_idx` ON `projects` (`name`);--> statement-breakpoint
CREATE INDEX `projects_created_at_idx` ON `projects` (`created_at`);--> statement-breakpoint
CREATE INDEX `projects_updated_at_idx` ON `projects` (`updated_at`);--> statement-breakpoint
CREATE TABLE `repositories` (
	`created_at` text DEFAULT (CURRENT_TIMESTAMP) NOT NULL,
	`file_count` integer,
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`last_scanned_at` text,
	`name` text NOT NULL,
	`path` text NOT NULL,
	`project_id` integer NOT NULL,
	`updated_at` text DEFAULT (CURRENT_TIMESTAMP) NOT NULL,
	FOREIGN KEY (`project_id`) REFERENCES `projects`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `repositories_project_id_idx` ON `repositories` (`project_id`);--> statement-breakpoint
CREATE INDEX `repositories_path_idx` ON `repositories` (`path`);--> statement-breakpoint
CREATE TABLE `feature_requests` (
	`created_at` text DEFAULT (CURRENT_TIMESTAMP) NOT NULL,
	`description` text,
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`implementation_plan` text,
	`project_id` integer NOT NULL,
	`refined_requirements` text,
	`research_findings` text,
	`status` text DEFAULT 'draft' NOT NULL,
	`title` text NOT NULL,
	`updated_at` text DEFAULT (CURRENT_TIMESTAMP) NOT NULL,
	FOREIGN KEY (`project_id`) REFERENCES `projects`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `feature_requests_project_id_idx` ON `feature_requests` (`project_id`);--> statement-breakpoint
CREATE INDEX `feature_requests_status_idx` ON `feature_requests` (`status`);