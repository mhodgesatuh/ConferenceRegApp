ALTER TABLE `registrations` MODIFY COLUMN `is_attendee` boolean DEFAULT true;--> statement-breakpoint
ALTER TABLE `registrations` ADD `is_cancelled` boolean DEFAULT false;