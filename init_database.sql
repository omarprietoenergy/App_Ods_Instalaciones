-- ==============================================
-- ODS Energy - Script de Inicialización de Base de Datos
-- Ejecutar en phpMyAdmin contra: puipcivu_odsenergy_app
-- ==============================================

-- Tabla de usuarios (con soporte para autenticación local)
CREATE TABLE IF NOT EXISTS `users` (
    `id` int AUTO_INCREMENT NOT NULL,
    `openId` varchar(64) NULL,
    `name` text,
    `email` varchar(320) NOT NULL,
    `password` text NULL,
    `loginMethod` varchar(64),
    `role` enum('admin','project_manager','technician','admin_manager') NOT NULL DEFAULT 'technician',
    `createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updatedAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    `lastSignedIn` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT `users_id` PRIMARY KEY(`id`),
    CONSTRAINT `users_openId_unique` UNIQUE(`openId`),
    CONSTRAINT `users_email_unique` UNIQUE(`email`)
);

-- Tabla de instalaciones
CREATE TABLE IF NOT EXISTS `installations` (
    `id` int AUTO_INCREMENT NOT NULL,
    `address` text NOT NULL,
    `clientName` varchar(255) NOT NULL,
    `clientDocument` varchar(50),
    `clientPhone` varchar(50),
    `clientEmail` varchar(320),
    `installationType` varchar(100) NOT NULL,
    `budget` varchar(50),
    `startDate` timestamp NULL,
    `endDate` timestamp NULL,
    `status` enum('pending','in_progress','completed','cancelled') NOT NULL DEFAULT 'pending',
    `assignedTechnicianId` int,
    `createdById` int NOT NULL,
    `createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updatedAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT `installations_id` PRIMARY KEY(`id`)
);

-- Tabla de documentos
CREATE TABLE IF NOT EXISTS `documents` (
    `id` int AUTO_INCREMENT NOT NULL,
    `installationId` int NOT NULL,
    `name` varchar(255) NOT NULL,
    `fileKey` varchar(500) NOT NULL,
    `fileUrl` text NOT NULL,
    `fileSize` int,
    `mimeType` varchar(100),
    `documentType` enum('plan','project','safety_plan','contract','permit','specification','other') NOT NULL,
    `uploadedById` int NOT NULL,
    `createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT `documents_id` PRIMARY KEY(`id`)
);

-- Tabla de partes diarios
CREATE TABLE IF NOT EXISTS `dailyReports` (
    `id` int AUTO_INCREMENT NOT NULL,
    `installationId` int NOT NULL,
    `userId` int NOT NULL,
    `reportDate` timestamp NOT NULL,
    `workDescription` text NOT NULL,
    `hoursWorked` int NOT NULL,
    `signatureUrl` text,
    `signatureKey` varchar(500),
    `createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updatedAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT `dailyReports_id` PRIMARY KEY(`id`)
);

-- Tabla de fotos
CREATE TABLE IF NOT EXISTS `photos` (
    `id` int AUTO_INCREMENT NOT NULL,
    `dailyReportId` int NOT NULL,
    `fileKey` varchar(500) NOT NULL,
    `fileUrl` text NOT NULL,
    `caption` text,
    `createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT `photos_id` PRIMARY KEY(`id`)
);

-- ==============================================
-- FIN DEL SCRIPT
-- Después de ejecutar, registra tu usuario en la app
-- El primer usuario registrado será Admin automáticamente
-- ==============================================
