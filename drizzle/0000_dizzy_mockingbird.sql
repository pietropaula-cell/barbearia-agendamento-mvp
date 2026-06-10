CREATE TABLE `appointments` (
	`id` int AUTO_INCREMENT NOT NULL,
	`barbershopId` int NOT NULL,
	`barberId` int NOT NULL,
	`serviceId` int,
	`customerId` int,
	`startsAt` timestamp NOT NULL,
	`endsAt` timestamp NOT NULL,
	`status` enum('pending','confirmed','cancelled','blocked') NOT NULL DEFAULT 'pending',
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `appointments_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `barber_schedules` (
	`id` int AUTO_INCREMENT NOT NULL,
	`barberId` int NOT NULL,
	`dayOfWeek` smallint NOT NULL,
	`startTime` varchar(5) NOT NULL,
	`endTime` varchar(5) NOT NULL,
	CONSTRAINT `barber_schedules_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `barbers` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int,
	`barbershopId` int NOT NULL,
	`name` varchar(100) NOT NULL,
	`bio` text,
	`avatarUrl` varchar(255),
	`active` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `barbers_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `barbershops` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(100) NOT NULL,
	`slug` varchar(100) NOT NULL,
	`phone` varchar(20),
	`address` varchar(255),
	`description` text,
	`ownerId` int,
	`active` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `barbershops_id` PRIMARY KEY(`id`),
	CONSTRAINT `barbershops_slug_unique` UNIQUE(`slug`)
);
--> statement-breakpoint
CREATE TABLE `customers` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(100) NOT NULL,
	`phone` varchar(20) NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `customers_id` PRIMARY KEY(`id`),
	CONSTRAINT `customers_phone_unique` UNIQUE(`phone`)
);
--> statement-breakpoint
CREATE TABLE `services` (
	`id` int AUTO_INCREMENT NOT NULL,
	`barbershopId` int NOT NULL,
	`name` varchar(100) NOT NULL,
	`description` text,
	`durationMin` smallint NOT NULL,
	`price` decimal(10,2) NOT NULL,
	`active` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `services_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `users` (
	`id` int AUTO_INCREMENT NOT NULL,
	`openId` varchar(64) NOT NULL,
	`name` text,
	`email` varchar(320),
	`loginMethod` varchar(64),
	`role` enum('user','admin','owner','barber') NOT NULL DEFAULT 'user',
	`barbershopId` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	`lastSignedIn` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `users_id` PRIMARY KEY(`id`),
	CONSTRAINT `users_openId_unique` UNIQUE(`openId`)
);
