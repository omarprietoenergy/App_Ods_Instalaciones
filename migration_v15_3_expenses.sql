-- Migration v15.3: Expenses & Materials Update

-- 1. Create expenses table
CREATE TABLE IF NOT EXISTS `expenses` (
  `id` int NOT NULL AUTO_INCREMENT,
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
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2. Update materials table columns (if not exist)
-- Check for supplierName
SET @exist := (SELECT COUNT(*) FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = 'materials' AND column_name = 'supplierName');
SET @sql := IF(@exist > 0, 'SELECT "Column supplierName already exists"', 'ALTER TABLE `materials` ADD COLUMN `supplierName` varchar(255)');
PREPARE stmt FROM @sql;
EXECUTE stmt;

-- Check for deliveryNoteNumber
SET @exist := (SELECT COUNT(*) FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = 'materials' AND column_name = 'deliveryNoteNumber');
SET @sql := IF(@exist > 0, 'SELECT "Column deliveryNoteNumber already exists"', 'ALTER TABLE `materials` ADD COLUMN `deliveryNoteNumber` varchar(100)');
PREPARE stmt FROM @sql;
EXECUTE stmt;

-- Check for deliveryNotePhotoKey
SET @exist := (SELECT COUNT(*) FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = 'materials' AND column_name = 'deliveryNotePhotoKey');
SET @sql := IF(@exist > 0, 'SELECT "Column deliveryNotePhotoKey already exists"', 'ALTER TABLE `materials` ADD COLUMN `deliveryNotePhotoKey` varchar(500)');
PREPARE stmt FROM @sql;
EXECUTE stmt;

-- Check for deliveryNotePhotoUrl
SET @exist := (SELECT COUNT(*) FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = 'materials' AND column_name = 'deliveryNotePhotoUrl');
SET @sql := IF(@exist > 0, 'SELECT "Column deliveryNotePhotoUrl already exists"', 'ALTER TABLE `materials` ADD COLUMN `deliveryNotePhotoUrl` text');
PREPARE stmt FROM @sql;
EXECUTE stmt;

-- Update materials status enum (this is tricky in MySQL, usually ignored or requires full ALTER TABLE MODIFY)
-- Providing the ALTER command just in case, typically safe to run if enum values are superset
ALTER TABLE `materials` MODIFY COLUMN `status` enum('pending','requested','approved','ordered','received','incident','closed','rejected') NOT NULL DEFAULT 'pending';
