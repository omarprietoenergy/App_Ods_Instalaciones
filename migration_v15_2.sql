-- ODS Energy v15.2 Migration Script (phpMyAdmin Friendly)
-- Idempotent: Can be run multiple times safely.
-- NO DELIMITERS / NO STORED PROCEDURES (Compatible with shared hosting/phpMyAdmin)

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
SET time_zone = "+00:00";

-- 1. Create tables if they don't exist (using camelCase names and DATE type)

CREATE TABLE IF NOT EXISTS `technicianShifts` (
  `id` int NOT NULL AUTO_INCREMENT,
  `technicianId` int NOT NULL,
  `date` DATE NOT NULL,
  `status` enum('active','paused','ended') NOT NULL DEFAULT 'active',
  `startAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `endAt` timestamp NULL DEFAULT NULL,
  `totalMinutes` int NOT NULL DEFAULT '0',
  `activeStartAt` timestamp NULL DEFAULT NULL,
  `createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `technicianShifts_technicianId_date_unique` (`technicianId`,`date`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS `notifications` (
  `id` int NOT NULL AUTO_INCREMENT,
  `type` varchar(50) NOT NULL,
  `installationId` int DEFAULT NULL,
  `technicianId` int DEFAULT NULL,
  `date` DATE DEFAULT NULL,
  `message` text NOT NULL,
  `readAt` timestamp NULL DEFAULT NULL,
  `createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- 2. Modify technicianDailyAssignments (Idempotent using PREPARE/EXECUTE)

-- Add approvalStatus
SET @databasename = DATABASE();
SET @tablename = "technicianDailyAssignments";
SET @columnname = "approvalStatus";
SET @preparedStatement = (SELECT IF(
  (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE (table_name = @tablename) AND (table_schema = @databasename) AND (column_name = @columnname)) > 0,
  "SELECT 1",
  CONCAT("ALTER TABLE `", @tablename, "` ADD COLUMN `", @columnname, "` enum('approved','pending') NOT NULL DEFAULT 'approved';")
));
PREPARE alterIfNotExists FROM @preparedStatement;
EXECUTE alterIfNotExists;
DEALLOCATE PREPARE alterIfNotExists;

-- Add assignmentSource
SET @columnname = "assignmentSource";
SET @preparedStatement = (SELECT IF(
  (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE (table_name = @tablename) AND (table_schema = @databasename) AND (column_name = @columnname)) > 0,
  "SELECT 1",
  CONCAT("ALTER TABLE `", @tablename, "` ADD COLUMN `", @columnname, "` enum('pm','system','technician') NOT NULL DEFAULT 'pm';")
));
PREPARE alterIfNotExists FROM @preparedStatement;
EXECUTE alterIfNotExists;
DEALLOCATE PREPARE alterIfNotExists;

-- Add totalMinutes
SET @columnname = "totalMinutes";
SET @preparedStatement = (SELECT IF(
  (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE (table_name = @tablename) AND (table_schema = @databasename) AND (column_name = @columnname)) > 0,
  "SELECT 1",
  CONCAT("ALTER TABLE `", @tablename, "` ADD COLUMN `", @columnname, "` int NOT NULL DEFAULT '0';")
));
PREPARE alterIfNotExists FROM @preparedStatement;
EXECUTE alterIfNotExists;
DEALLOCATE PREPARE alterIfNotExists;

-- Add activeStartTime
SET @columnname = "activeStartTime";
SET @preparedStatement = (SELECT IF(
  (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE (table_name = @tablename) AND (table_schema = @databasename) AND (column_name = @columnname)) > 0,
  "SELECT 1",
  CONCAT("ALTER TABLE `", @tablename, "` ADD COLUMN `", @columnname, "` timestamp NULL DEFAULT NULL;")
));
PREPARE alterIfNotExists FROM @preparedStatement;
EXECUTE alterIfNotExists;
DEALLOCATE PREPARE alterIfNotExists;


-- 3. Deduplicate Daily Assignments (Cleaning before Unique Index)
-- Keeps the most recent entry for (technicianId, installationId, date)

DELETE t1 FROM technicianDailyAssignments t1
INNER JOIN technicianDailyAssignments t2 
WHERE 
    t1.id < t2.id AND 
    t1.technicianId = t2.technicianId AND 
    t1.installationId = t2.installationId AND 
    t1.date = t2.date;

-- 4. Add Unique Index (Safe check with PREPARE/EXECUTE)

SET @indexname = "unique_assignment";
SET @preparedStatement = (SELECT IF(
  (SELECT COUNT(*) FROM INFORMATION_SCHEMA.STATISTICS WHERE (table_name = @tablename) AND (table_schema = @databasename) AND (index_name = @indexname)) > 0,
  "SELECT 1",
  CONCAT("CREATE UNIQUE INDEX `", @indexname, "` ON `", @tablename, "` (`technicianId`, `installationId`, `date`);")
));
PREPARE createIndexIfNotExists FROM @preparedStatement;
EXECUTE createIndexIfNotExists;
DEALLOCATE PREPARE createIndexIfNotExists;

SELECT "Migration v15.2 completed successfully" as result;
