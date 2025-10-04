ALTER TABLE `registrations` MODIFY COLUMN `proxy_email` varchar(128);--> statement-breakpoint
ALTER TABLE `registrations` ADD `cancellation_reason` varchar(512);