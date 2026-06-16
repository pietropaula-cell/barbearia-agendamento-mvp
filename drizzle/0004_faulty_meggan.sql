ALTER TABLE `barber_schedules` ADD `breakStartTime` varchar(5);--> statement-breakpoint
ALTER TABLE `barber_schedules` ADD `breakEndTime` varchar(5);--> statement-breakpoint
ALTER TABLE `barbershops` DROP COLUMN `facadeUrl`;