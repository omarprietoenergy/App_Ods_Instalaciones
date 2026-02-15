CREATE TABLE IF NOT EXISTS `auxiliaryContacts` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `installationId` int(11) NOT NULL,
  `contactName` varchar(255) NOT NULL,
  `contactPhone` varchar(50) DEFAULT NULL,
  `contactRole` varchar(100) DEFAULT NULL,
  `createdAt` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `installationNotes` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `installationId` int(11) NOT NULL,
  `userId` int(11) NOT NULL,
  `noteText` text NOT NULL,
  `parentNoteId` int(11) DEFAULT NULL,
  `createdAt` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
