CREATE TABLE `dailyReports` (
	`id` int AUTO_INCREMENT NOT NULL,
	`installationId` int NOT NULL,
	`userId` int NOT NULL,
	`reportDate` timestamp NOT NULL,
	`workDescription` text NOT NULL,
	`hoursWorked` int NOT NULL,
	`signatureUrl` text,
	`signatureKey` varchar(500),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `dailyReports_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `documents` (
	`id` int AUTO_INCREMENT NOT NULL,
	`installationId` int NOT NULL,
	`name` varchar(255) NOT NULL,
	`fileKey` varchar(500) NOT NULL,
	`fileUrl` text NOT NULL,
	`fileSize` int,
	`mimeType` varchar(100),
	`documentType` enum('plan','project','safety_plan','contract','permit','specification','other') NOT NULL,
	`uploadedById` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `documents_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `installations` (
	`id` int AUTO_INCREMENT NOT NULL,
	`address` text NOT NULL,
	`clientName` varchar(255) NOT NULL,
	`clientDocument` varchar(50),
	`clientPhone` varchar(50),
	`clientEmail` varchar(320),
	`installationType` varchar(100) NOT NULL,
	`budget` varchar(50),
	`startDate` timestamp,
	`endDate` timestamp,
	`status` enum('pending','in_progress','completed','cancelled') NOT NULL DEFAULT 'pending',
	`assignedTechnicianId` int,
	`createdById` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `installations_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `photos` (
	`id` int AUTO_INCREMENT NOT NULL,
	`dailyReportId` int NOT NULL,
	`fileKey` varchar(500) NOT NULL,
	`fileUrl` text NOT NULL,
	`caption` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `photos_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `users` MODIFY COLUMN `role` enum('admin','project_manager','technician','admin_manager') NOT NULL DEFAULT 'technician';