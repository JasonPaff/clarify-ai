ALTER TABLE `step_configurations` ADD `ai_discovery_ignore_patterns` text;--> statement-breakpoint
ALTER TABLE `step_configurations` ADD `ai_discovery_max_files` integer DEFAULT 50;--> statement-breakpoint
ALTER TABLE `step_configurations` ADD `ai_discovery_token_budget` integer;