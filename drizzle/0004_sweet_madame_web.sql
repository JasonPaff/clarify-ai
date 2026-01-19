CREATE TABLE `repository_overviews` (
	`content` text NOT NULL,
	`created_at` text DEFAULT (CURRENT_TIMESTAMP) NOT NULL,
	`generated_at` text NOT NULL,
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`last_edited_at` text,
	`manual_content` text,
	`model_id` text NOT NULL,
	`prompt_used` text NOT NULL,
	`repository_id` integer NOT NULL,
	`updated_at` text DEFAULT (CURRENT_TIMESTAMP) NOT NULL,
	FOREIGN KEY (`repository_id`) REFERENCES `repositories`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `repository_overviews_repository_id_unique` ON `repository_overviews` (`repository_id`);--> statement-breakpoint
CREATE INDEX `repository_overviews_repository_id_idx` ON `repository_overviews` (`repository_id`);