CREATE TABLE `people` (
	`id` int AUTO_INCREMENT NOT NULL,
	`created_at` timestamp DEFAULT CURRENT_TIMESTAMP,
	`updated_at` timestamp DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
	`email` varchar(128) NOT NULL,
	`phone` varchar(128),
	`first_name` varchar(128) NOT NULL,
	`last_name` varchar(128) NOT NULL,
	`name_prefix` varchar(128),
	`name_suffix` varchar(128),
	`cancelled_attendance` boolean,
	`is_attendee` boolean,
	`is_monitor` boolean,
	`is_organizer` boolean,
	`is_presenter` boolean,
	`is_proxy` boolean,
	`has_proxy` boolean,
	`proxy_id` int,
	CONSTRAINT `people_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `registration` (
	`id` int AUTO_INCREMENT NOT NULL,
	`created_at` timestamp DEFAULT CURRENT_TIMESTAMP,
	`updated_at` timestamp DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
	`info1` varchar(128) NOT NULL,
	`info2` varchar(128) NOT NULL,
	`question1` varchar(128) NOT NULL,
	`question2` varchar(128) NOT NULL,
	CONSTRAINT `registration_id` PRIMARY KEY(`id`),
	CONSTRAINT `registration_info1_unique` UNIQUE(`info1`),
	CONSTRAINT `registration_info2_unique` UNIQUE(`info2`),
	CONSTRAINT `registration_question1_unique` UNIQUE(`question1`),
	CONSTRAINT `registration_question2_unique` UNIQUE(`question2`)
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
