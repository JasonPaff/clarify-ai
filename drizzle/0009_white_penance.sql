CREATE TABLE `feature_request_context_files` (
	`created_at` text DEFAULT (CURRENT_TIMESTAMP) NOT NULL,
	`display_name` text NOT NULL,
	`feature_request_id` integer NOT NULL,
	`file_path` text NOT NULL,
	`file_type` text NOT NULL,
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`included_in_context` integer DEFAULT true NOT NULL,
	`size_bytes` integer NOT NULL,
	`updated_at` text DEFAULT (CURRENT_TIMESTAMP) NOT NULL,
	FOREIGN KEY (`feature_request_id`) REFERENCES `feature_requests`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `feature_request_context_files_feature_request_id_file_path_idx` ON `feature_request_context_files` (`feature_request_id`,`file_path`);--> statement-breakpoint
CREATE INDEX `feature_request_context_files_feature_request_id_idx` ON `feature_request_context_files` (`feature_request_id`);--> statement-breakpoint
CREATE INDEX `feature_request_context_files_file_type_idx` ON `feature_request_context_files` (`file_type`);