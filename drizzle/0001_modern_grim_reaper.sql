CREATE TABLE `whatsapp_configs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`barbershopId` int NOT NULL,
	`phoneNumber` varchar(20) NOT NULL,
	`apiKey` varchar(255) NOT NULL,
	`enabled` boolean NOT NULL DEFAULT false,
	`sendConfirmation` boolean NOT NULL DEFAULT true,
	`sendReminder` boolean NOT NULL DEFAULT true,
	`reminderMinutesBefore` int NOT NULL DEFAULT 60,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `whatsapp_configs_id` PRIMARY KEY(`id`),
	CONSTRAINT `whatsapp_configs_barbershopId_unique` UNIQUE(`barbershopId`)
);
