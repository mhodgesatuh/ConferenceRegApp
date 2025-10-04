CREATE TABLE `credentials` (
	`id` int AUTO_INCREMENT NOT NULL,
	`created_at` timestamp DEFAULT CURRENT_TIMESTAMP,
	`updated_at` timestamp DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
	`registration_id` int NOT NULL,
	`login_pin` varchar(8) NOT NULL,
	CONSTRAINT `credentials_id` PRIMARY KEY(`id`),
	CONSTRAINT `uq_credentials_registration_id` UNIQUE(`registration_id`)
);
--> statement-breakpoint
ALTER TABLE `credentials` ADD CONSTRAINT `credentials_registration_id_registrations_id_fk` FOREIGN KEY (`registration_id`) REFERENCES `registrations`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `idx_credentials_registration_id` ON `credentials` (`registration_id`);--> statement-breakpoint
ALTER TABLE `registrations` DROP COLUMN `login_pin`;