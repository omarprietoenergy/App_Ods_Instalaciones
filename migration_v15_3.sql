-- MIGRATION v15.3 (Epic B - Cost Control)
-- Optimized for phpMyAdmin execution (No DELIMITER, No Stored Procedures)

-- 1. Create 'expenses' table if it doesn't exist
CREATE TABLE IF NOT EXISTS `expenses` (
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
  `createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `expenses_installationId_idx` (`installationId`),
  KEY `expenses_userId_idx` (`userId`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- 2. Modify 'materials' table structure
-- Using 'IF NOT EXISTS' for columns is supported in MariaDB 10.2+ and MySQL 8.0.29+
-- If you are on an older version and these fail, simply run the ALTER statements without 'IF NOT EXISTS'
-- ignoring errors if the columns differ.

ALTER TABLE `materials` 
ADD COLUMN IF NOT EXISTS `supplierName` varchar(255) NULL,
ADD COLUMN IF NOT EXISTS `deliveryNoteNumber` varchar(100) NULL,
ADD COLUMN IF NOT EXISTS `deliveryNotePhotoKey` varchar(500) NULL,
ADD COLUMN IF NOT EXISTS `deliveryNotePhotoUrl` text NULL;

-- 3. Update 'materials' status ENUM
-- This modifies the column definition to include new statuses. 
-- It is idempotent-ish: re-running it just re-defines the same enum.
ALTER TABLE `materials` 
MODIFY COLUMN `status` enum('pending','requested','approved','ordered','received','incident','closed','rejected') NOT NULL DEFAULT 'pending';

-- 4. Add index to materials if helpful for the new logic (optional but recommended)
-- We use a safe check by attempting to create index only if we could wrap it, 
-- but since we can't use procedures, we just add a simple INDEX creation.
-- Standard MySQL CREATE INDEX doesn't support IF NOT EXISTS in all versions, 
-- but we can try generic syntax or let it fail safely if duplicate.
-- Skipping explicit CREATE INDEX IF NOT EXISTS to avoid syntax errors on older DBs. 
-- The keys are likely already handled by ORM or primary keys.

COMMIT;
