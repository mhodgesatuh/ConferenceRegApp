ALTER TABLE `registrations` ADD `has_rsvp` boolean DEFAULT 0 NOT NULL AFTER is_attendee;
CREATE INDEX `idx_has_rsvp` ON `registrations` (`has_rsvp`);
