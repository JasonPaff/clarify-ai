CREATE TABLE `feature_request_repositories` (
	`created_at` text DEFAULT (CURRENT_TIMESTAMP) NOT NULL,
	`feature_request_id` integer NOT NULL,
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`repository_id` integer NOT NULL,
	FOREIGN KEY (`feature_request_id`) REFERENCES `feature_requests`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`repository_id`) REFERENCES `repositories`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `feature_request_repositories_feature_request_id_repository_id_idx` ON `feature_request_repositories` (`feature_request_id`,`repository_id`);--> statement-breakpoint
CREATE INDEX `feature_request_repositories_feature_request_id_idx` ON `feature_request_repositories` (`feature_request_id`);--> statement-breakpoint
CREATE INDEX `feature_request_repositories_repository_id_idx` ON `feature_request_repositories` (`repository_id`);