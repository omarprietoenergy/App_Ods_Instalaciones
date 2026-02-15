CREATE TABLE `auxiliaryContacts` (
	`id` int AUTO_INCREMENT NOT NULL,
	`installationId` int NOT NULL,
	`contactName` varchar(255) NOT NULL,
	`contactPhone` varchar(50),
	`contactRole` varchar(100),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `auxiliaryContacts_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `emailTemplates` (
	`id` int AUTO_INCREMENT NOT NULL,
	`templateType` enum('installation_started','installation_completed','client_conformity') NOT NULL,
	`subject` varchar(255) NOT NULL,
	`body` text NOT NULL,
	`signature` text,
	`logoUrl` text,
	`isActive` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `emailTemplates_id` PRIMARY KEY(`id`),
	CONSTRAINT `emailTemplates_templateType_unique` UNIQUE(`templateType`)
);
--> statement-breakpoint
CREATE TABLE `expenses` (
	`id` int AUTO_INCREMENT NOT NULL,
	`installationId` int NOT NULL,
	`userId` int NOT NULL,
	`date` date NOT NULL,
	`category` enum('fuel','toll','parking','hotel','meal','vehicle_cleaning','store_purchase','other') NOT NULL,
	`vendor` varchar(255) NOT NULL,
	`documentNumber` varchar(100) NOT NULL,
	`amount` decimal(10,2) NOT NULL,
	`receiptPhotoKey` varchar(500) NOT NULL,
	`receiptPhotoUrl` text NOT NULL,
	`status` enum('pending','approved','rejected') NOT NULL DEFAULT 'pending',
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `expenses_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `installationAuditLogs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`installationId` int NOT NULL,
	`userId` int NOT NULL,
	`action` varchar(100) NOT NULL,
	`details` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `installationAuditLogs_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `installationNotes` (
	`id` int AUTO_INCREMENT NOT NULL,
	`installationId` int NOT NULL,
	`userId` int NOT NULL,
	`noteText` text NOT NULL,
	`parentNoteId` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `installationNotes_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `installationStatusHistory` (
	`id` int AUTO_INCREMENT NOT NULL,
	`installationId` int NOT NULL,
	`userId` int NOT NULL,
	`previousStatus` varchar(50),
	`newStatus` varchar(50) NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `installationStatusHistory_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `materials` (
	`id` int AUTO_INCREMENT NOT NULL,
	`installationId` int NOT NULL,
	`userId` int NOT NULL,
	`type` enum('received','requested') NOT NULL,
	`requestId` varchar(100),
	`materialName` varchar(255) NOT NULL,
	`quantity` int NOT NULL,
	`description` text,
	`supplierName` varchar(255),
	`deliveryNoteNumber` varchar(100),
	`deliveryNotePhotoKey` varchar(500),
	`deliveryNotePhotoUrl` text,
	`status` enum('pending','requested','approved','ordered','received','incident','closed','rejected') NOT NULL DEFAULT 'pending',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `materials_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `notifications` (
	`id` int AUTO_INCREMENT NOT NULL,
	`type` enum('assignment_pending','material_update','system') NOT NULL,
	`installationId` int,
	`technicianId` int,
	`date` date,
	`message` text NOT NULL,
	`readAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `notifications_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `technicianDailyAssignments` (
	`id` int AUTO_INCREMENT NOT NULL,
	`installationId` int NOT NULL,
	`technicianId` int NOT NULL,
	`date` date NOT NULL,
	`status` enum('assigned','working','paused','completed') NOT NULL DEFAULT 'assigned',
	`approvalStatus` enum('approved','pending') NOT NULL DEFAULT 'approved',
	`assignmentSource` enum('pm','system','technician') NOT NULL DEFAULT 'pm',
	`startTime` time,
	`endTime` time,
	`totalMinutes` int DEFAULT 0,
	`activeStartTime` timestamp,
	`totalHours` int DEFAULT 0,
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `technicianDailyAssignments_id` PRIMARY KEY(`id`),
	CONSTRAINT `unique_assignment` UNIQUE(`technicianId`,`installationId`,`date`)
);
--> statement-breakpoint
CREATE TABLE `technicianShifts` (
	`id` int AUTO_INCREMENT NOT NULL,
	`technicianId` int NOT NULL,
	`date` date NOT NULL,
	`status` enum('active','paused','ended') NOT NULL DEFAULT 'active',
	`startAt` timestamp NOT NULL DEFAULT (now()),
	`endAt` timestamp,
	`totalMinutes` int DEFAULT 0,
	`activeStartAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `technicianShifts_id` PRIMARY KEY(`id`),
	CONSTRAINT `unique_shift` UNIQUE(`technicianId`,`date`)
);
--> statement-breakpoint
ALTER TABLE `documents` MODIFY COLUMN `documentType` enum('plan','project','safety_plan','contract','permit','specification','conformity','other') NOT NULL;--> statement-breakpoint
ALTER TABLE `installations` MODIFY COLUMN `installationType` varchar(100) NOT NULL DEFAULT 'solar';--> statement-breakpoint
ALTER TABLE `users` MODIFY COLUMN `openId` varchar(64);--> statement-breakpoint
ALTER TABLE `users` MODIFY COLUMN `email` varchar(320) NOT NULL;--> statement-breakpoint
ALTER TABLE `documents` ADD `description` text;--> statement-breakpoint
ALTER TABLE `installations` ADD `clientId` varchar(255) NOT NULL;--> statement-breakpoint
ALTER TABLE `installations` ADD `workOrderType` enum('installation','breakdown','maintenance') DEFAULT 'installation' NOT NULL;--> statement-breakpoint
ALTER TABLE `installations` ADD `workDescription` text;--> statement-breakpoint
ALTER TABLE `installations` ADD `installationPrice` decimal(10,2);--> statement-breakpoint
ALTER TABLE `installations` ADD `laborPrice` decimal(10,2);--> statement-breakpoint
ALTER TABLE `installations` ADD `assignedTechnicianIds` json;--> statement-breakpoint
ALTER TABLE `installations` ADD `clientSignatureUrl` text;--> statement-breakpoint
ALTER TABLE `installations` ADD `clientSignatureDate` timestamp;--> statement-breakpoint
ALTER TABLE `installations` ADD `technicianObservations` text;--> statement-breakpoint
ALTER TABLE `installations` ADD `conformityPdfUrl` text;--> statement-breakpoint
ALTER TABLE `installations` ADD `conformityPdfKey` varchar(500);--> statement-breakpoint
ALTER TABLE `users` ADD `password` text;--> statement-breakpoint
ALTER TABLE `users` ADD CONSTRAINT `users_email_unique` UNIQUE(`email`);--> statement-breakpoint
ALTER TABLE `installations` DROP COLUMN `assignedTechnicianId`;