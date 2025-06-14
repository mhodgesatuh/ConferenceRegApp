CREATE INDEX `idx_people_cancelled_attendance` ON `people` (`cancelled_attendance`);--> statement-breakpoint
CREATE INDEX `idx_people_is_attendee` ON `people` (`is_attendee`);--> statement-breakpoint
CREATE INDEX `idx_people_is_monitor` ON `people` (`is_monitor`);--> statement-breakpoint
CREATE INDEX `idx_people_is_organizer` ON `people` (`is_organizer`);--> statement-breakpoint
CREATE INDEX `idx_people_is_presenter` ON `people` (`is_presenter`);--> statement-breakpoint
CREATE INDEX `idx_people_is_proxy` ON `people` (`is_proxy`);--> statement-breakpoint
CREATE INDEX `idx_people_has_proxy` ON `people` (`has_proxy`);--> statement-breakpoint
CREATE INDEX `idx_people_proxy_id` ON `people` (`proxy_id`);--> statement-breakpoint
CREATE INDEX `idx_validation_tables_value` ON `validation_tables` (`value`);