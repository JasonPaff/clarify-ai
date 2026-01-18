ALTER TABLE `projects` ADD `is_favorited` integer DEFAULT false NOT NULL;--> statement-breakpoint
CREATE INDEX `projects_is_favorited_idx` ON `projects` (`is_favorited`);