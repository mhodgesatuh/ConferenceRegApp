CREATE TABLE `conference_info` (
	`id` int AUTO_INCREMENT NOT NULL,
	`created_at` timestamp DEFAULT CURRENT_TIMESTAMP,
	`updated_at` timestamp DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
	`info1` varchar(128) NOT NULL,
	`info2` varchar(128) NOT NULL,
	CONSTRAINT `conference_info_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `registrations` (
	`id` int AUTO_INCREMENT NOT NULL,
	`created_at` timestamp DEFAULT CURRENT_TIMESTAMP,
	`updated_at` timestamp DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
	`email` varchar(128) NOT NULL,
	`login_pin` varchar(8) NOT NULL,
	`phone1` varchar(32),
	`phone2` varchar(32),
	`first_name` varchar(128),
	`last_name` varchar(128) NOT NULL,
	`name_prefix` varchar(128),
	`name_suffix` varchar(128),
	`proxy_name` varchar(128),
	`proxy_phone` varchar(32),
	`proxy_email` varchar(128) NOT NULL,
	`day1_attendee` boolean DEFAULT false,
	`day2_attendee` boolean DEFAULT false,
	`question1` varchar(128) NOT NULL,
	`question2` varchar(128) NOT NULL,
	`cancelled_attendance` boolean DEFAULT false,
	`is_attendee` boolean DEFAULT false,
	`is_monitor` boolean DEFAULT false,
	`is_organizer` boolean DEFAULT false,
	`is_presenter` boolean DEFAULT false,
	`is_sponsor` boolean DEFAULT false,
	`has_proxy` boolean DEFAULT false,
	CONSTRAINT `registrations_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `validation_tables` (
	`id` int AUTO_INCREMENT NOT NULL,
	`created_at` timestamp DEFAULT CURRENT_TIMESTAMP,
	`updated_at` timestamp DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
	`validation_table` varchar(32) NOT NULL,
	`value` varchar(128) NOT NULL,
	CONSTRAINT `validation_tables_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE INDEX `idx_cancelled_attendance` ON `registrations` (`cancelled_attendance`);--> statement-breakpoint
CREATE INDEX `idx_is_attendee` ON `registrations` (`is_attendee`);--> statement-breakpoint
CREATE INDEX `idx_is_monitor` ON `registrations` (`is_monitor`);--> statement-breakpoint
CREATE INDEX `idx_is_organizer` ON `registrations` (`is_organizer`);--> statement-breakpoint
CREATE INDEX `idx_is_presenter` ON `registrations` (`is_presenter`);--> statement-breakpoint
CREATE INDEX `idx_is_sponsor` ON `registrations` (`is_sponsor`);--> statement-breakpoint
CREATE INDEX `idx_has_proxy` ON `registrations` (`has_proxy`);--> statement-breakpoint
CREATE INDEX `idx_validation_tables_value` ON `validation_tables` (`value`);